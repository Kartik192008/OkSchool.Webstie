import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { Link } from "wouter";

type Question = {
  id?: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  solution?: string;
};

export function GenerateMock() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(30);
  const [correctMarks, setCorrectMarks] = useState(4);
  const [incorrectMarks, setIncorrectMarks] = useState(-1);
  const [unattemptedMarks, setUnattemptedMarks] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    setQuestions([...questions, { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setError("Please login to create a mock test");
        return;
      }

      const validQuestions = questions.filter(q => q.question.trim() && q.optionA.trim() && q.optionB.trim() && q.optionC.trim() && q.optionD.trim());

      if (validQuestions.length === 0) {
        setError("Please add at least one complete question");
        return;
      }

      const response = await fetch(`${API_BASE}/mock-tests/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title,
          description,
          subject: subject || "General",
          section: "My Mocks",
          duration,
          correctMarks,
          incorrectMarks,
          unattemptedMarks,
          questions: validQuestions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create mock test");
      }

      setLocation("/my-mocks");
    } catch (err) {
      console.error("Failed to create mock test:", err);
      setError("Failed to create mock test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions.map((q: any) => ({
            question: q.question || "",
            optionA: q.optionA || "",
            optionB: q.optionB || "",
            optionC: q.optionC || "",
            optionD: q.optionD || "",
            correctAnswer: q.correctAnswer || "A",
            solution: q.solution || "",
          })));
        }
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.subject) setSubject(data.subject);
        if (data.duration) setDuration(data.duration);
        if (data.correctMarks) setCorrectMarks(data.correctMarks);
        if (data.incorrectMarks) setIncorrectMarks(data.incorrectMarks);
        if (data.unattemptedMarks) setUnattemptedMarks(data.unattemptedMarks);
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/mock-tests">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">Generate Your Own Mock</h1>
                <p className="text-muted-foreground text-sm mt-1">Create a personalized mock test for yourself</p>
              </div>
            </div>
            <div>
              <label htmlFor="json-import" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <FileJson className="h-4 w-4 mr-2" />
                    Import JSON
                  </span>
                </Button>
              </label>
              <input
                id="json-import"
                type="file"
                accept=".json"
                onChange={handleJSONImport}
                className="hidden"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My Mock Test"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your mock test..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (min)</label>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Correct Marks</label>
                    <Input
                      type="number"
                      value={correctMarks}
                      onChange={(e) => setCorrectMarks(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Incorrect Marks</label>
                    <Input
                      type="number"
                      value={incorrectMarks}
                      onChange={(e) => setIncorrectMarks(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unattempted Marks</label>
                    <Input
                      type="number"
                      value={unattemptedMarks}
                      onChange={(e) => setUnattemptedMarks(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-semibold">Questions</h2>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.map((q, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Question *</label>
                    <Textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(index, "question", e.target.value)}
                      placeholder="Enter your question..."
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Option A *</label>
                      <Input
                        value={q.optionA}
                        onChange={(e) => updateQuestion(index, "optionA", e.target.value)}
                        placeholder="Option A"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Option B *</label>
                      <Input
                        value={q.optionB}
                        onChange={(e) => updateQuestion(index, "optionB", e.target.value)}
                        placeholder="Option B"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Option C *</label>
                      <Input
                        value={q.optionC}
                        onChange={(e) => updateQuestion(index, "optionC", e.target.value)}
                        placeholder="Option C"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Option D *</label>
                      <Input
                        value={q.optionD}
                        onChange={(e) => updateQuestion(index, "optionD", e.target.value)}
                        placeholder="Option D"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Correct Answer *</label>
                    <Select
                      value={q.correctAnswer}
                      onValueChange={(value) => updateQuestion(index, "correctAnswer", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Solution (Optional)</label>
                      <Input
                        value={q.solution}
                        onChange={(e) => updateQuestion(index, "solution", e.target.value)}
                        placeholder="Explain the answer..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Mock Test"}
              </Button>
              <Link href="/mock-tests">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
