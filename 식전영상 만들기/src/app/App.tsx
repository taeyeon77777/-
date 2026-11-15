import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { NaverLoginPage } from "./components/NaverLoginPage";
import { EditorFlow } from "./components/EditorFlow";
import { ProjectHistory } from "./components/ProjectHistory";
import { TemplateEditorPage } from "./components/admin/TemplateEditorPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";

type Page = "landing" | "login" | "editor" | "history" | "admin" | "customers";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const [resumeDraftId, setResumeDraftId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  const handleStart = (templateId?: string) => {
    setSelectedTemplate(templateId);
    setResumeDraftId(undefined);
    setPage("login");
  };

  const handleResume = (draftId: string, templateId: string) => {
    setResumeDraftId(draftId);
    setSelectedTemplate(templateId);
    setPage("editor");
  };

  const handleGoAdmin = () => {
    setIsAdmin(true);
    setPage("customers");
  };

  return (
    <div className="size-full bg-gray-200 flex items-center justify-center min-h-screen">
      {/* MARKER-MAKE-KIT-INVOKED */}
      {page === "landing" && (
        <LandingPage
          onStart={handleStart}
          onGoHistory={() => setPage("history")}
          onGoAdmin={handleGoAdmin}
          isAdmin={isAdmin}
        />
      )}
      {page === "login" && (
        <NaverLoginPage
          onLogin={() => setPage("editor")}
          onBack={() => setPage("landing")}
        />
      )}
      {page === "editor" && (
        <EditorFlow
          templateId={selectedTemplate}
          draftId={resumeDraftId}
          isAdmin={isAdmin}
          onBack={() => setPage("landing")}
          onGoHistory={() => setPage("history")}
          onGoAdmin={() => setPage("admin")}
        />
      )}
      {page === "history" && (
        <ProjectHistory
          onBack={() => setPage("landing")}
          onResume={handleResume}
          onNewProject={() => setPage("landing")}
        />
      )}
      {page === "customers" && (
        <AdminDashboard
          onBack={() => setPage("landing")}
          onGoTemplateEditor={() => setPage("admin")}
        />
      )}
      {page === "admin" && (
        <TemplateEditorPage onBack={() => setPage("customers")} />
      )}
    </div>
  );
}
