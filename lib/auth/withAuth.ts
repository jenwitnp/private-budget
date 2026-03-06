import { GetServerSideProps, GetServerSidePropsResult } from "next";
import { getSession } from "next-auth/react";

/**
 * Higher-order component to protect pages that require authentication
 * Redirects unauthenticated users to login page
 *
 * Usage:
 * export const getServerSideProps = withAuth(async (context) => {
 *   return { props: {} };
 * });
 */
export function withAuth(gssp?: (context: any) => Promise<any>) {
  return async (context: any): Promise<GetServerSidePropsResult<any>> => {
    const session = await getSession(context);

    // If no session exists, redirect to login
    if (!session) {
      return {
        redirect: {
          destination: "/auth/login",
          permanent: false,
        },
      };
    }

    // Check if user has valid role
    if (!session.user || !session.user.role) {
      return {
        redirect: {
          destination: "/unauthorized",
          permanent: false,
        },
      };
    }

    // If additional getServerSideProps provided, execute it
    if (gssp) {
      const gsspData = await gssp(context);

      // If gssp returned a redirect or notFound, return that
      if ("redirect" in gsspData || "notFound" in gsspData) {
        return gsspData;
      }

      // Merge props
      return {
        props: {
          ...gsspData.props,
          session,
        },
      };
    }

    return {
      props: { session },
    };
  };
}

/**
 * Basic auth check - just pass as getServerSideProps
 * Usage:
 * export const getServerSideProps = requireAuth;
 */
export const requireAuth: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  if (!session.user || !session.user.role) {
    return {
      redirect: {
        destination: "/unauthorized",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};
