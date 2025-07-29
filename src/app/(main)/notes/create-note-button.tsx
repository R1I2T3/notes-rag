"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import CreateUpdateNoteDialog from "./CreateUpdateNoteDialog";

export function CreateNoteButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus />
        Create Note
      </Button>
      <CreateUpdateNoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
