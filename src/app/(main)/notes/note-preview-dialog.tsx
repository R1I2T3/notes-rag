"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { Trash2, Edit2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import Markdown from "@/components/markdown";
import CreateUpdateNoteDialog from "./CreateUpdateNoteDialog";
interface NotePreviewDialogProps {
  note: Doc<"notes">;
}

export function NotePreviewDialog({ note }: NotePreviewDialogProps) {
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("noteId") === note._id;

  const deleteNote = useMutation(api.notes.deleteNote);
  const [deletePending, setDeletePending] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  async function handleDelete() {
    setDeletePending(true);
    try {
      await deleteNote({ noteId: note._id });
      toast.success("Note deleted");
      handleClose();
    } catch (error) {
      console.error("Failed to delete note", error);
      toast.error("Failed to delete note. Please try again.");
    } finally {
      setDeletePending(false);
    }
  }

  function handleClose() {
    if (deletePending) return;
    window.history.pushState(null, "", window.location.pathname);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{note.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 whitespace-pre-wrap">
          <Markdown>{note.body}</Markdown>
        </div>
        <DialogFooter className="mt-6">
          <Button
            className="gap-2"
            onClick={() => {
              setUpdateDialogOpen(true);
            }}
          >
            <Edit2 size={16} />
            Update Note
          </Button>
          <CreateUpdateNoteDialog
            open={updateDialogOpen}
            onOpenChange={setUpdateDialogOpen}
            note={note}
          />
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleDelete}
            disabled={deletePending}
          >
            <Trash2 size={16} />
            {deletePending ? "Deleting..." : "Delete Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
