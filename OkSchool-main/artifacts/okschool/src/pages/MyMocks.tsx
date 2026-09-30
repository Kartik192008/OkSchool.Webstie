import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Play, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { Link } from "wouter";

type MockTest = {
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

export function MyMocks() {
  const [, setLocation] = useLocation();
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMocks = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setLocation("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/mock-tests/user?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error("Failed to fetch mocks");
      const data = await response.json();
      setMocks(data);
    } catch (err) {
      console.error("Failed to fetch user mocks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMocks();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this mock test?")) return;

    try {
      const response = await fetch(`${API_BASE}/mock-tests/user/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setMocks(mocks.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to delete mock test:", err);
      alert("Failed to delete mock test");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <h1 className="text-3xl font-serif font-bold text-foreground">My Mocks</h1>
                <p className="text-muted-foreground text-sm mt-1">Practice your custom mock tests anytime</p>
              </div>
            </div>
            <Link href="/generate-mock">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate New Mock
              </Button>
            </Link>
          </div>

          {mocks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-2">No Mocks Yet</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Create your first mock test to start practicing
                  </p>
                  <Link href="/generate-mock">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Your First Mock
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {mocks.map((mock) => (
                <Card key={mock.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{mock.title}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">{mock.description}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 ml-2">
                        {mock.subject}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{mock.questionCount} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{mock.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>+{mock.correctMarks}/-{Math.abs(mock.incorrectMarks)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/mock-test/${mock.id}`} className="flex-1">
                        <Button className="w-full">
                          <Play className="h-4 w-4 mr-2" />
                          Practice
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(mock.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
