import { useAction } from "convex/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { draftToMarkdown } from "markdown-draft-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Doc } from "../../../../convex/_generated/dataModel";
const FullFeaturedEditor = dynamic(() => import("./text_editor"), {
  ssr: false,
});
const noteFormSchema = z.object({
  title: z.string().min(1, {
    message: "Title cannot be empty.",
  }),
  body: z.string().min(1, {
    message: "Body cannot be empty.",
  }),
});

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Doc<"notes">;
}

export default function CreateUpdateNoteDialog({
  open,
  onOpenChange,
  note,
}: CreateNoteDialogProps) {
  const createNote = useAction(api.notes_action.createNote);
  const updateNote = useAction(api.notes_action.updateNote);
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || "",
      body: note?.body || "",
    },
  });

  async function onSubmit(values: z.infer<typeof noteFormSchema>) {
    setLoading(true);
    try {
      if (note) {
        await updateNote({
          noteId: note._id,
          title: values.title,
          body: values.body,
        });
      } else {
        await createNote({
          title: values.title,
          body: values.body,
        });
      }

      toast.success(
        note ? "Note Updated Successfully" : "Note Created Successfully"
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating Notes", error);
      toast.error("Failed to create Note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Fill in the details for your new note. Click save when you&apos;re
            done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Note title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <FullFeaturedEditor
                      onChange={(draft) =>
                        field.onChange(draftToMarkdown(draft))
                      }
                      ref={field.ref}
                      defaultMarkdown={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="w-full">
              <Button type="submit" disabled={loading} className="mt-10 w-full">
                {note ? "Update Note" : "Create Note"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
