import { useState, useEffect } from "react";
import { Clock, FileText, Play, ChevronRight, ChevronLeft, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useListMockTests } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";

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
  isUserGenerated: number;
  userId?: string;
  createdAt: string;
};

export function MockTestList() {
  const { data: adminTests, isLoading: adminLoading } = useListMockTests({
    query: { queryKey: ["mock-tests"] },
  });

  const [userTests, setUserTests] = useState<MockTest[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"admin" | "my">("admin");

  const getUserId = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchUserTests = async () => {
      const userId = await getUserId();
      if (!userId) {
        setUserLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/mock-tests/user?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          setUserTests(data);
        }
      } catch {
        setUserTests([]);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserTests();
  }, []);

  const tests = activeTab === "admin" ? (adminTests ?? []) : userTests;
  const isLoading = activeTab === "admin" ? adminLoading : userLoading;

  return (
    <div className="container mx-auto px-4 py-10 max-h-[calc(100dvh-160px)] overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">Mock Tests</h1>
            <p className="text-muted-foreground">Choose a test to start practicing.</p>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "admin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="h-4 w-4 mr-1 inline" /> Official Tests
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "my"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4 mr-1 inline" /> My Tests
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        ) : !tests || tests.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold mb-2">
              {activeTab === "admin" ? "No Official Tests Available" : "No Custom Tests Yet"}
            </h2>
            <p className="text-muted-foreground">
              {activeTab === "admin"
                ? "Check back later for new practice tests."
                : "Create your own mock tests from the Generate tab."}
            </p>
            {activeTab === "my" && (
              <Link href="/generate-mock" className="mt-4 inline-block">
                <Button>Create a Test</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {selectedSection ? (
              <div>
                <button
                  onClick={() => setSelectedSection(null)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> All Sections
                </button>
                <h2 className="font-serif text-2xl font-bold mb-2">{selectedSection}</h2>
                <p className="text-muted-foreground mb-6">
                  {tests.filter((t) => t.section === selectedSection).length} test{tests.filter((t) => t.section === selectedSection).length !== 1 ? "s" : ""} available
                </p>
                <div className="grid md:grid-cols-2 gap-6 max-h-[calc(100dvh-260px)] overflow-y-auto pr-2">
                  {tests
                    .filter((t) => t.section === selectedSection)
                    .map((test) => (
                      <div key={test.id} className="bg-card border border-card-border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h2 className="font-serif text-xl font-semibold">{test.title}</h2>
                              {test.isUserGenerated && (
                                <Badge variant="secondary" className="text-xs">
                                  <User className="h-3 w-3 mr-1" /> Custom
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{test.description}</p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {test.subject}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            <span>{test.questionCount} Questions</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{test.duration} min</span>
                          </div>
                        </div>
                        <Link href={`/mock-test/${test.id}`}>
                          <Button className="w-full">
                            <Play className="h-4 w-4 mr-2" />
                            Start Test
                          </Button>
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100dvh-240px)] overflow-y-auto pr-2">
                {Object.keys(
                  tests.reduce<Record<string, typeof tests>>((acc, test) => {
                    const section = test.section || "General";
                    if (!acc[section]) acc[section] = [];
                    acc[section].push(test);
                    return acc;
                  }, {})
                ).map((section) => (
                  <button
                    key={section}
                    onClick={() => setSelectedSection(section)}
                    className="bg-card border border-card-border rounded-xl p-6 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-serif text-xl font-semibold">{section}</h2>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tests.filter((t) => t.section === section).length} test{tests.filter((t) => t.section === section).length !== 1 ? "s" : ""} available
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
