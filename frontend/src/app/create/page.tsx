'use client';

import { SlideGenerator } from "@/components/SlideGenerator";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return <SlideGenerator onBack={handleBack} isEditMode={false} />;
}