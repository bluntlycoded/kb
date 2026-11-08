"use client";

import { Camera, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { AvatarFace, tints } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import type { AvatarChoice, Person } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

const EMOJIS = ["🦊", "🐼", "🐯", "🦁", "🐨", "🐸", "🦉", "🐙", "🌸", "🌻", "🚀", "⚡", "🎧", "🎨", "🏏", "☕", "🎉", "🧠"];

/** Resize to a 256 px square so the photo stays small. */
function toSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function AvatarPicker({ open, onClose, person }: { open: boolean; onClose: () => void; person: Person }) {
  const { updateProfile } = useDemo();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [choice, setChoice] = useState<AvatarChoice | undefined>(person.avatar);
  const [error, setError] = useState<string>();
  const emoji = choice?.kind === "emoji" ? choice : { kind: "emoji" as const, emoji: EMOJIS[0], tint: 0 };

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 8 * 1024 * 1024) return setError("That image is over 8 MB. Choose a smaller one.");
    try {
      setChoice({ kind: "photo", src: await toSquareDataUrl(file) });
      setError(undefined);
    } catch {
      setError("We couldn't read that image. Try another one.");
    }
  }

  function save() {
    updateProfile({ avatar: choice });
    toast({ title: choice ? "Profile picture updated" : "Profile picture removed" });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profile picture"
      description="Upload a photo or pick an avatar. Everyone in the company sees it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <AvatarFace name={person.name} avatar={choice} size="xl" />
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onFile} aria-label="Upload a photo" />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload aria-hidden /> Upload photo
            </Button>
            {choice && (
              <Button variant="ghost" className="text-danger" onClick={() => setChoice(undefined)}>
                <Trash2 aria-hidden /> Use initials instead
              </Button>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Or pick an avatar</legend>
          <div className="grid grid-cols-6 gap-2">
            {EMOJIS.map((e) => {
              const on = choice?.kind === "emoji" && choice.emoji === e;
              return (
                <button
                  key={e}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Avatar ${e}`}
                  onClick={() => setChoice({ kind: "emoji", emoji: e, tint: emoji.tint })}
                  className={cn("inline-flex aspect-square cursor-pointer items-center justify-center rounded-xl border text-2xl", on ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2")}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </fieldset>

        {choice?.kind === "emoji" && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Background</legend>
            <div className="flex flex-wrap gap-2">
              {tints.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={choice.tint === i}
                  aria-label={`Background ${i + 1}`}
                  onClick={() => setChoice({ ...choice, tint: i })}
                  className={cn("size-9 cursor-pointer rounded-full ring-offset-2 ring-offset-surface", t, choice.tint === i && "ring-2 ring-fg")}
                />
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </Modal>
  );
}

export function ChangePhotoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Change profile picture"
      className="absolute -top-1 -right-1 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-fg shadow-card hover:bg-surface-2"
    >
      <Camera className="size-4" aria-hidden />
    </button>
  );
}
