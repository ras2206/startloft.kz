import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-loft-darker" />}>
      <SuccessClient />
    </Suspense>
  );
}
