import { useEffect, useState, useCallback } from "react";
import { useParams } from "wouter";
import { useSEO, documentUrl } from "@/lib/seo";
import { Download, FileText, Lock, BookOpen, X, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useGetDocument,
  getGetDocumentQueryKey,
  useRecordDocumentView,
  useRecordDocumentDownload,
  useListDocuments,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api";

export function StudyMaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const docId = parseInt(id ?? "0", 10);
  const { toast } = useToast();

  const proxyFileUrl = (type: "pdf" | "word" | "thumbnail") =>
    `${API_BASE}/api/documents/${docId}/download?type=${type}`;

  const [showWordModal, setShowWordModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const { data: doc, isLoading } = useGetDocument(docId, {
    query: { enabled: !!docId, queryKey: getGetDocumentQueryKey(docId) },
  });

  // Load Google AdSense script
  useEffect(() => {
    if (!document.getElementById("google-ad-script")) {
      const s = document.createElement("script");
      s.id = "google-ad-script";
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      s.async = true;
      document.head.appendChild(s);
    }
}
  );
}
