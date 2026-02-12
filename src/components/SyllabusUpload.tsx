import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  roomId: string;
  onSyllabusProcessed: () => void;
}

export default function SyllabusUpload({ roomId, onSyllabusProcessed }: Props) {
  const [loading, setLoading] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const text = await file.text();
    setTextContent(text);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleSubmit = async () => {
    if (!textContent.trim()) {
      toast.error("Please upload or paste syllabus content");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-syllabus", {
        body: { content: textContent, roomId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Syllabus processed! 7 territories created.");
      onSyllabusProcessed();
    } catch (err: any) {
      toast.error(err.message || "Failed to process syllabus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-xp" />
        <h3 className="font-display font-semibold">Upload Syllabus</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a text file or paste your syllabus content. AI will generate 7 chapter territories with quiz questions.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop a file here or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">.txt, .md files supported</p>
      </div>

      {/* Or paste */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-1 block">Or paste content:</label>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste your syllabus content here..."
          rows={6}
          className="w-full bg-secondary border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {textContent && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>{textContent.length} characters loaded</span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !textContent.trim()}
        className="w-full font-display gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> AI is generating territories...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" /> Generate 7 Territories
          </>
        )}
      </Button>
    </motion.div>
  );
}
