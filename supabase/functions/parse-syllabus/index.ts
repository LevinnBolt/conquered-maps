import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, roomId } = await req.json();

    if (!content || !roomId) {
      return new Response(JSON.stringify({ error: "Missing content or roomId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI to parse syllabus
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an educational content parser. Given a syllabus or study material, create exactly 7 chapters/levels. For each chapter generate exactly 5 multiple-choice questions with 4 options each. Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Short Chapter Title",
      "questions": [
        {
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "difficulty": "easy"
        }
      ],
      "timeLimit": 120
    }
  ]
}

Rules:
- Exactly 7 chapters
- Exactly 5 questions per chapter
- correctAnswer is the 0-based index of the correct option
- difficulty: "easy" for chapters 1-2, "medium" for 3-5, "hard" for 6-7
- timeLimit: 180 for easy, 120 for medium, 90 for hard
- Questions should test understanding, not just memorization
- Make questions progressively harder`
          },
          {
            role: "user",
            content: `Parse this syllabus into 7 chapters with quiz questions:\n\n${content.slice(0, 8000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_syllabus",
              description: "Create a structured syllabus with 7 chapters and quiz questions",
              parameters: {
                type: "object",
                properties: {
                  chapters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        chapterNumber: { type: "number" },
                        title: { type: "string" },
                        questions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              question: { type: "string" },
                              options: { type: "array", items: { type: "string" } },
                              correctAnswer: { type: "number" },
                              difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                            },
                            required: ["question", "options", "correctAnswer", "difficulty"],
                            additionalProperties: false
                          }
                        },
                        timeLimit: { type: "number" }
                      },
                      required: ["chapterNumber", "title", "questions", "timeLimit"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["chapters"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_syllabus" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI processing failed");
    }

    const aiData = await aiResponse.json();
    
    let syllabusData;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      syllabusData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content_text = aiData.choices?.[0]?.message?.content || "";
      syllabusData = JSON.parse(content_text);
    }

    // Save to room
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ syllabus_data: syllabusData })
      .eq("id", roomId);

    if (updateError) throw updateError;

    // Initialize first chapter as available for the user
    await supabase.from("progress").upsert(
      {
        user_id: user.id,
        room_id: roomId,
        chapter_number: 1,
        status: "available",
      },
      { onConflict: "user_id,room_id,chapter_number" }
    );

    return new Response(JSON.stringify({ success: true, chapters: syllabusData.chapters?.length || 7 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-syllabus error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
