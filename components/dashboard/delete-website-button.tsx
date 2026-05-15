"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteWebsiteButton({
  websiteId,
  websiteName,
  variant = "default",
}: {
  websiteId: string;
  websiteName: string;
  variant?: "default" | "icon";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("websites")
      .delete()
      .eq("id", websiteId);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    setOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          variant === "icon" ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="h-7 w-7 rounded-full bg-background/90 shadow-sm backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
              aria-label={`Delete ${websiteName}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="destructive" className="apple-pill gap-2">
              <Trash2 className="h-4 w-4" />
              Delete website
            </Button>
          )
        }
      />
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {websiteName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the website and all analytics data — pageviews,
            sessions, and events cannot be recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            className="apple-pill"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete permanently"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
