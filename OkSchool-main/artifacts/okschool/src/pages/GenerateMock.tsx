import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, Upload, X, History, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { Link } from "wouter";

type ParsedQuestion = {
  question: string;
  hasImage: boolean;
  imageUrl: string | null;
  options: any[];
  correctAnswer: string;
};

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

type Attempt = {
  id: number;
  mockTestId: number;
  title: string;
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  timeTaken: number;
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

const JSON_EXAMPLE = `[
  {
    "section": "Physics",
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
]`;

export function GenerateMock() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"create" | "library" | "history">("create");
  const [form, setForm] = useState(EMPTY_FORM);

  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [questionImages, setQuestionImages] = useState<Record<number, string>>({});

  const [mocks, setMocks] = useState<UserMock[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUserId = useCallback(async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id || null;
    } catch {
      return null;
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) {
      setLocation("/login");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/mock-tests/user?userId=${encodeURIComponent(userId)}`);
      if (res.ok) setMocks(await res.json());
    } catch {
      setMocks([]);
    }
  }, [getUserId, setLocation]);

  const loadHistory = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/mock-test/history/${encodeURIComponent(userId)}`);
      if (res.ok) setAttempts(await res.json());
    } catch {
      setAttempts([]);
    }
  }, [getUserId]);

  useEffect(() => {
    Promise.all([loadLibrary(), loadHistory()]).finally(() => setIsLoading(false));
  }, [loadLibrary, loadHistory]);

  // Only attempts on mocks the user generated themselves. Admin-provided
  // mocks have their own history on the Mock Test History page.
  const myMockIds = new Set(mocks.map((m) => m.id));
  const myAttempts = attempts.filter((a) => myMockIds.has(a.mockTestId));

  const handleParseJsonFile = async (file: File) => {
    setJsonFile(file);
    try {
      const jsonData = JSON.parse(await file.text());
      let questionsArray: any[];

      if (Array.isArray(jsonData)) {
        questionsArray = jsonData;
      } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
        questionsArray = jsonData.questions;
      } else {
        toast({ title: "Invalid JSON", description: "JSON must be an array of questions or contain a 'questions' array", variant: "destructive" });
        setParsedQuestions([]);
        return;
      }

      setParsedQuestions(
        questionsArray.map((q: any, index: number) => ({
          question: q.question || q.questionText || q.q || `Question ${index + 1}`,
          section: q.section || "General",
          hasImage: !!q.questionImage || !!q.image,
          imageUrl: q.questionImage || q.image || null,
          options: q.options || [],
          correctAnswer: String(q.correctAnswer || q.answer || q.correct || "").toUpperCase(),
        })),
      );
      setQuestionImages({});
      toast({ title: `Parsed ${questionsArray.length} questions` });
    } catch (error: any) {
      toast({ title: "Error parsing JSON", description: error.message, variant: "destructive" });
      setParsedQuestions([]);
    }
  };

  const handleQuestionImageUpload = async (index: number, file: File) => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setQuestionImages((prev) => ({ ...prev, [index]: base64 }));
      setParsedQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, hasImage: true, imageUrl: base64 } : q)));
    } catch (error: any) {
      toast({ title: "Error uploading image", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveQuestionImage = (index: number) => {
    setQuestionImages((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setParsedQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, hasImage: false, imageUrl: null } : q)));
  };

  const postMockTest = async (payload: unknown, attempts = 2): Promise<Response> => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/api/mock-tests/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        // Render free-tier services spin down; a cold start answers 502/503/504.
        // Retry once so the first request after idle can succeed.
        if (res.ok || ![502, 503, 504].includes(res.status) || attempt === attempts) {
          return res;
        }
        await sleep(6000);
      } catch (err) {
        if (attempt === attempts) throw err;
        await sleep(6000);
      }
    }
    throw new Error("Request failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = await getUserId();
      if (!userId) {
        toast({ title: "Please login first" });
        setLocation("/login");
        return;
      }

      if (parsedQuestions.length === 0) {
        toast({ title: "Questions JSON file is required", variant: "destructive" });
        return;
      }

      const questions = parsedQuestions.map((q: any, index: number) => {
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
        }

        return {
          section: q.section || form.section || "General",
          question: q.question,
          questionImage: questionImages[index] || q.imageUrl || null,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer: q.correctAnswer,
          solution: q.solution || null,
        };
      });

      setIsSubmitting(true);
      const res = await postMockTest({
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
      });

      if (!res.ok) {
        let detail = `Request failed with status ${res.status}`;
        try {
          const err = await res.json();
          detail = err.error || err.details || detail;
        } catch {
          const text = await res.text().catch(() => "");
          if (text) detail = `${detail} - ${text.slice(0, 200)}`;
        }
        throw new Error(detail);
      }

      toast({ title: "Mock test created!" });
      setForm(EMPTY_FORM);
      setJsonFile(null);
      setParsedQuestions([]);
      setQuestionImages({});
      const input = document.getElementById("gm-json") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadLibrary();
      setActiveTab("library");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not create the mock test.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this mock test? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/mock-tests/user/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMocks((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Mock test deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete the mock test.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-2xl font-bold">Generate Your Own Mock</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-2 whitespace-nowrap">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-md border border-black bg-white text-black text-sm transition duration-200 ${activeTab === "create" ? "shadow-[4px_4px_0px_0px_rgba(0,0,0)]" : ""}`}
          >
            <Plus className="h-4 w-4 inline mr-1.5" /> Create Mock
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 rounded-md border border-black bg-white text-black text-sm transition duration-200 ${activeTab === "library" ? "shadow-[4px_4px_0px_0px_rgba(0,0,0)]" : ""}`}
          >
            <Library className="h-4 w-4 inline mr-1.5" /> Library ({mocks.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-md border border-black bg-white text-black text-sm transition duration-200 ${activeTab === "history" ? "shadow-[4px_4px_0px_0px_rgba(0,0,0)]" : ""}`}
          >
            <History className="h-4 w-4 inline mr-1.5" /> History ({myAttempts.length})
          </button>
        </div>
      </div>

      {/* CREATE TAB */}
      {activeTab === "create" && (
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
                {[...new Set(mocks.map((m) => m.section))].map((s) => (
                  <option key={s} value={s} />
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
              <Input
                id="gm-json"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) handleParseJsonFile(file);
                  else {
                    setJsonFile(null);
                    setParsedQuestions([]);
                  }
                }}
                className="mt-1"
                accept=".json"
                required={parsedQuestions.length === 0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a JSON file with questions. Supports images via "questionImage" field. Format: array of objects with question, options, correctAnswer, and solution fields.
              </p>
              <details className="mt-3">
                <summary className="text-xs text-primary cursor-pointer hover:underline">View JSON format example</summary>
                <pre className="mt-2 bg-muted rounded-lg p-3 text-xs overflow-x-auto text-muted-foreground">{JSON_EXAMPLE}</pre>
              </details>
            </div>

            {parsedQuestions.length > 0 && (
              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Parsed Questions ({parsedQuestions.length})</h3>
                  <span className="text-xs text-muted-foreground">{jsonFile?.name}</span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {parsedQuestions.map((q, index) => (
                    <div key={index} className="border border-card-border rounded-lg p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">Q{index + 1}. {q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">Correct answer: {q.correctAnswer || "-"}</p>
                        {q.hasImage && (
                          <p className="text-xs text-green-600 mt-0.5">Image attached</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor={`gm-img-${index}`} className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild>
                            <span><Upload className="h-3.5 w-3.5" /></span>
                          </Button>
                        </label>
                        <input
                          id={`gm-img-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleQuestionImageUpload(index, file);
                          }}
                        />
                        {q.hasImage && (
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveQuestionImage(index)}>
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting || parsedQuestions.length === 0} data-testid="button-create-mock">
                {isSubmitting ? "Creating..." : "Add Mock Test"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* LIBRARY TAB */}
      {activeTab === "library" && (
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
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No mock tests yet. Create one from the Create Mock tab.</td></tr>
                ) : (
                  mocks.map((test) => (
                    <tr key={test.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/mock-test/${test.id}`} className="font-medium text-foreground hover:text-primary">{test.title}</Link>
                        <p className="text-xs text-muted-foreground line-clamp-1">{test.description}</p>
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
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-card-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Mock Test</th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Correct</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Incorrect</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Unattempted</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
                ) : myAttempts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No attempts yet. Attempt one of your own mocks to see your history.</td></tr>
                ) : (
                  myAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/mock-test/${a.mockTestId}`} className="font-medium text-foreground hover:text-primary">{a.title || `Mock #${a.mockTestId}`}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{a.score}</span>
                        <span className="text-muted-foreground"> / {a.maxScore}</span>
                      </td>
                      <td className="px-4 py-3 text-green-600 hidden sm:table-cell">{a.correct}</td>
                      <td className="px-4 py-3 text-destructive hidden sm:table-cell">{a.incorrect}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{a.unattempted}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
