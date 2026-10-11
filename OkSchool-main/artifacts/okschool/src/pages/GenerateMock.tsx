import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { Link } from "wouter";

type UserMock = {
  id: number;
  title: string;
  description: string;
  subject: string;
  section: string;
  duration: number;
  questionCount: number;
  correctMarks: number;
  incorrectMarks: number;
  unattemptedMarks: number;
  userId?: string;
  isUserGenerated: number;
  createdAt: string;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  subject: "",
  section: "",
  duration: "30",
  correctMarks: "4",
  incorrectMarks: "-1",
  unattemptedMarks: "0",
};

export function GenerateMock() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [mocks, setMocks] = useState<UserMock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadMocks = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setLocation("/login");
        return;
      }
      const res = await fetch(`${API_BASE}/mock-tests/user?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMocks(data);
    } catch {
      setMocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMocks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this mock test? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/mock-tests/user/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMocks((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Mock test deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete the mock test.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        toast({ title: "Please login first" });
        setLocation("/login");
        return;
      }

      const input = document.getElementById("gm-json") as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (!file) {
        toast({ title: "Questions JSON file is required", variant: "destructive" });
        return;
      }

      const text = await file.text();
      const jsonData = JSON.parse(text);
      let questionsArray: any[];
      if (Array.isArray(jsonData)) {
        questionsArray = jsonData;
      } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
        questionsArray = jsonData.questions;
      } else {
        toast({ title: "Invalid JSON", description: "JSON must be an array of questions or contain a 'questions' array", variant: "destructive" });
        return;
      }

      const questions = questionsArray.map((q: any, index: number) => {
        let optionA = "", optionB = "", optionC = "", optionD = "";

        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: any) => {
            const optId = String(opt.optionId || opt.id || "").toUpperCase();
            const optText = opt.text || opt.content || opt.value || "";
            if (optId === "A") optionA = optText;
            if (optId === "B") optionB = optText;
            if (optId === "C") optionC = optText;
            if (optId === "D") optionD = optText;
          });
        } else {
          optionA = q.optionA || q.A || q.a || "";
          optionB = q.optionB || q.B || q.b || "";
          optionC = q.optionC || q.C || q.c || "";
          optionD = q.optionD || q.D || q.d || "";
        }

        return {
          question: q.question || q.questionText || q.q || `Question ${index + 1}`,
          questionImage: q.questionImage || q.image || null,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer: String(q.correctAnswer || q.answer || q.correct || "").toUpperCase(),
          solution: q.solution || q.explanation || null,
        };
      });

      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/mock-tests/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: form.title,
          description: form.description,
          subject: form.subject,
          section: form.section || "General",
          duration: parseInt(form.duration, 10) || 30,
          correctMarks: parseInt(form.correctMarks, 10) || 4,
          incorrectMarks: parseInt(form.incorrectMarks, 10) || -1,
          unattemptedMarks: parseInt(form.unattemptedMarks, 10) || 0,
          questions,
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast({ title: "Mock test created!" });
      setForm(EMPTY_FORM);
      if (input) input.value = "";
      await loadMocks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not create the mock test.", variant: "destructive" });
    } finally {
      setUploading(false);
      setIsSubmitting(false);
    }
  };

  const sections = [...new Set(mocks.map((m) => m.section))];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/mock-tests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-serif text-2xl font-bold">Generate Your Own Mock</h1>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4" /> Add Mock Test</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="gm-title">Title *</Label>
            <Input id="gm-title" placeholder="Test name" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="gm-desc">Description</Label>
            <Input id="gm-desc" placeholder="Brief description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="gm-subject">Subject *</Label>
            <Input id="gm-subject" placeholder="Physics, Chemistry, etc." value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="gm-section">Section / Exam *</Label>
            <Input id="gm-section" list="gm-section-list" placeholder="e.g. JEE, NEET, CBSE" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className="mt-1" required />
            <datalist id="gm-section-list">
              {sections.map((section) => (
                <option key={section} value={section} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="gm-duration">Duration (minutes) *</Label>
            <Input id="gm-duration" type="number" placeholder="30" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="gm-correct">Correct Answer Marks *</Label>
            <Input id="gm-correct" type="number" placeholder="4" value={form.correctMarks} onChange={(e) => setForm((f) => ({ ...f, correctMarks: e.target.value }))} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="gm-incorrect">Incorrect Answer Marks *</Label>
            <Input id="gm-incorrect" type="number" placeholder="-1" value={form.incorrectMarks} onChange={(e) => setForm((f) => ({ ...f, incorrectMarks: e.target.value }))} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="gm-unattempted">Unattempted Marks *</Label>
            <Input id="gm-unattempted" type="number" placeholder="0" value={form.unattemptedMarks} onChange={(e) => setForm((f) => ({ ...f, unattemptedMarks: e.target.value }))} className="mt-1" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="gm-json">Questions JSON File *</Label>
            <Input id="gm-json" type="file" className="mt-1" accept=".json" required />
            <p className="text-xs text-muted-foreground mt-1">
              Upload a JSON file with questions. Supports images via "questionImage" field. Format: array of objects with question, options, correctAnswer, and solution fields.
            </p>
            <details className="mt-3">
              <summary className="text-xs text-primary cursor-pointer hover:underline">View JSON format example</summary>
              <pre className="mt-2 bg-muted rounded-lg p-3 text-xs overflow-x-auto text-muted-foreground">
{`[
  {
    "question": "How many blocks of wood planks are obtained by crafting a single log?",
    "questionImage": "https://example.com/images/crafting-table.png",
    "options": [
      { "optionId": "A", "text": "2" },
      { "optionId": "B", "text": "4" },
      { "optionId": "C", "text": "6" },
      { "optionId": "D", "text": "8" }
    ],
    "correctAnswer": "B",
    "solution": "One log crafts into 4 wooden planks."
  }
]`}
              </pre>
            </details>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={uploading || isSubmitting} data-testid="button-create-mock">
              {uploading ? "Creating..." : isSubmitting ? "Adding..." : "Add Mock Test"}
            </Button>
          </div>
        </form>
      </div>

      {/* My mocks table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-card-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Section</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Subject</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Duration</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Questions</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
              ) : mocks.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No mock tests yet. Create one above.</td></tr>
              ) : (
                mocks.map((test) => (
                  <tr key={test.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/mock-test/${test.id}`} className="font-medium text-foreground hover:text-primary">
                        {test.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{test.section}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{test.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{test.duration} min</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{test.questionCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(test.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
