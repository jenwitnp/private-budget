import { useSession } from "next-auth/react";
import Layout from "@/components/layout/Layout";
import { GridMenu } from "@/components/GridMenu";
import { requireAuth } from "@/lib/auth/withAuth";

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <i className="fa-solid fa-spinner fa-spin text-5xl text-emerald-500"></i>
      </div>
    );
  }

  return (
    <Layout>
      <GridMenu UserProfile={false} />
    </Layout>
  );
}

export const getServerSideProps = requireAuth;
