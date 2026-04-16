"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type PrintAssociateActionsProps = {
  associateId: string;
  autoPrint?: boolean;
};

export function PrintAssociateActions({
  associateId,
  autoPrint = false,
}: PrintAssociateActionsProps) {
  const hasTriggeredAutoPrintRef = useRef(false);

  useEffect(() => {
    if (!autoPrint || hasTriggeredAutoPrintRef.current) {
      return;
    }

    hasTriggeredAutoPrintRef.current = true;
    let cancelled = false;

    async function triggerAutoPrint() {
      await waitForPrintableContent();

      if (cancelled) {
        return;
      }

      window.print();
    }

    void triggerAutoPrint();

    return () => {
      cancelled = true;
    };
  }, [autoPrint]);

  return (
    <div className="no-print flex flex-wrap gap-3">
      <Link href={`/associados/${associateId}/editar`} className="df-button-secondary">
        Voltar para edição
      </Link>
      <Link href="/associados" className="df-button-secondary">
        Ir para listagem
      </Link>
      <button type="button" onClick={() => window.print()} className="df-button-primary">
        Imprimir ficha
      </button>
    </div>
  );
}

async function waitForPrintableContent() {
  const images = Array.from(document.images);

  await Promise.all(
    images.map(async (image) => {
      if (image.complete) {
        return;
      }

      await new Promise<void>((resolve) => {
        const handleDone = () => {
          image.removeEventListener("load", handleDone);
          image.removeEventListener("error", handleDone);
          resolve();
        };

        image.addEventListener("load", handleDone, { once: true });
        image.addEventListener("error", handleDone, { once: true });
      });
    }),
  );

  if ("fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      // If font readiness fails, printing should still proceed.
    }
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 450);
  });
}
