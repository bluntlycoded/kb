"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { GAMES, QUIZZES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import { PeoplePicker } from "./people-picker";

/** "quiz:<id>" or "tic-tac-toe" */
type Choice = string;

export function InviteModal({
  open,
  onClose,
  presetUserId,
  presetChoice = `quiz:${QUIZZES[0].id}`,
}: {
  open: boolean;
  onClose: () => void;
  presetUserId?: string;
  presetChoice?: Choice;
}) {
  const { sendInvite, personById, state } = useDemo();
  const toast = useToast();
  const [choice, setChoice] = useState<Choice>(presetChoice);
  const [to, setTo] = useState<string[]>(presetUserId ? [presetUserId] : []);
  const [error, setError] = useState<string>();

  // Chess and Tic-Tac-Toe are one-on-one.
  const isTicTacToe = choice === "tic-tac-toe" || choice === "chess";

  function submit(e: FormEvent) {
    e.preventDefault();
    if (to.length === 0) return setError("Choose at least one colleague to invite.");
    if (isTicTacToe && to.length > 1) return setError("This game is for two players. Choose one colleague.");
    setError(undefined);
    const [gameKey, quizId] = choice.split(":");
    sendInvite(gameKey, to, quizId);
    const names = to.map((id) => personById(id)?.name.split(" ")[0]).join(", ");
    const busy = to.map((id) => personById(id)).filter((p) => p && p.status !== "ACTIVE");
    toast({
      title: `Invite sent to ${names}`,
      description: busy.length === to.length ? "They're not active right now, so they'll see it when they're back." : "We'll let you know when they accept.",
      tone: "info",
    });
    setTo(presetUserId ? [presetUserId] : []);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite to play"
      description="Colleagues who are active usually respond within a minute."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form">
            Send invite
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field id="game" label="Game">
          <Select id="game" value={choice} onChange={(e) => setChoice(e.target.value)}>
            <optgroup label="Quizzes">
              {QUIZZES.map((q) => (
                <option key={q.id} value={`quiz:${q.id}`}>
                  {q.title} ({q.questions.length} questions)
                </option>
              ))}
            </optgroup>
            <optgroup label="Games">
              {GAMES.filter((g) => (g.key === "chess" || g.key === "tic-tac-toe") && state.company.games.includes(g.key)).map((g) => (
                <option key={g.key} value={g.key}>
                  {g.name} ({g.players})
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">{isTicTacToe ? "Who do you want to play?" : "Who do you want to play with?"}</legend>
          <PeoplePicker selected={to} onChange={setTo} multiple={!isTicTacToe} label="Choose colleagues" />
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-danger">
              {error}
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
