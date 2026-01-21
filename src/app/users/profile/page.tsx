"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase-client";

export default function ProfileRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToUserProfile = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("user_number")
        .eq("id", user.id)
        .single();

      if (profile?.user_number) {
        router.replace(`/users/${profile.user_number}/profile`);
      } else {
        router.replace(`/users/${user.id}/profile`);
      }
    };

    redirectToUserProfile();
  }, [router]);

  return (
    <>
      <style>{`
        .loader-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0,0,0,0.1);
          border-top-color: #4361EE;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    </>
  );
}
