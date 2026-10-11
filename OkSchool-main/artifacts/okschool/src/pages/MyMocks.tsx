import { useEffect } from "react";
import { useLocation } from "wouter";

export function MyMocks() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/generate-mock");
  }, [setLocation]);

  return null;
}
