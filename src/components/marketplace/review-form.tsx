"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRatingInput } from "./star-rating";
import { useCreateReview } from "@/lib/queries";

export function ReviewForm({ vendorId }: { vendorId: string }) {
  const createReview = useCreateReview();
  const [name, setName] = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");

  const valid = name.trim().length >= 2 && rating > 0 && comment.trim().length >= 8;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Please add your name, a rating and a short review.");
      return;
    }
    try {
      const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
      await createReview.mutateAsync({
        vendorId,
        author: name.trim(),
        avatar: initials || "AN",
        rating,
        comment: comment.trim(),
      });
      toast.success("Thanks for your review!");
      setName("");
      setRating(0);
      setComment("");
    } catch {
      toast.error("Could not submit your review. Try again.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-muted/40 p-4"
    >
      <h4 className="font-semibold">Write a review</h4>
      <div className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Your name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Rating</Label>
            <StarRatingInput value={rating} onChange={setRating} size={24} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Your experience</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about the service, quality and overall experience…"
            rows={3}
            className="resize-none"
          />
        </div>
        <Button
          type="submit"
          disabled={createReview.isPending || !valid}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {createReview.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Posting…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Post review
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
