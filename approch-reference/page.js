import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import AllCarsPageClient from "@/app/(public)/components/pages/AllCarsPageClient";
import Breadcrumb from "@/app/(public)/components/ui/Breadcrumb";
import SuspenseLoading from "@/app/(public)/components/ui/SuspenseLoading";
import StructuredDataScripts from "@/app/(public)/components/seo/StructuredDataScripts";
import { getQueryClient } from "@/lib/getQueryClient";
import { getCarsPageAction } from "@/app/actions/carActions";
import { getWebInfo } from "@/app/services/server/core/reference";
import { generateBreadcrumbs } from "@/utils/breadcrumbUtils";
import { generateCarsMetadata } from "@/utils/metadata/carsMetadataUtils";
import { buildSiteUrl } from "@/utils/siteConfig";
import { predictQueryComplexity } from "@/app/services/server/utils/smartSearch/queryComplexityPredictor";
import { executeSmartSearchFallback } from "@/app/services/server/utils/smartSearch/enhancementExecutor";
import { hasValidQueryText } from "@/app/ai-customer/tools/naturalQueryBuilder";
import {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateSearchActionSchema,
  generateWebPageSchema,
} from "@/utils/structuredDataUtils";

// ⚡ ISR: 1-hour cache for all cars listing page (Pro Plan Optimized)
// This is a high-traffic page - 1 hour balances freshness and performance
export const revalidate = 3600; // 1 hour in seconds

/**
 * Build price filter strings from AI lte/gte objects
 */
function buildPriceFiltersFromAI(lte, gte) {
  const priceFilters = {};

  // Convert price ranges to string format
  if (lte?.price && gte?.price) {
    priceFilters.price = `${gte.price}-${lte.price}`;
  } else if (lte?.price) {
    priceFilters.price = `1-${lte.price}`;
  } else if (gte?.price) {
    priceFilters.price = `>${gte.price}`;
  }

  // Convert installment ranges
  if (lte?.ins_price && gte?.ins_price) {
    priceFilters.ins_price = `${gte.ins_price}-${lte.ins_price}`;
  } else if (lte?.ins_price) {
    priceFilters.ins_price = `1-${lte.ins_price}`;
  } else if (gte?.ins_price) {
    priceFilters.ins_price = `>${gte.ins_price}`;
  }

  return priceFilters;
}

// Generate dynamic metadata based on search params
export async function generateMetadata({ searchParams }) {
  const awaitedParams = await searchParams;
  const result = await generateCarsMetadata(awaitedParams);
  return result.metadata;
}

export default async function AllCarsPage({ searchParams }) {
  const queryClient = getQueryClient();
  const awaitedSearchParams = await searchParams;
  console.log("[Search Params] : ", awaitedSearchParams);

  // Generate metadata context info (includes parsed filters and metadata)
  const metadataResult = await generateCarsMetadata(awaitedSearchParams);
  const pageContext = metadataResult.contextInfo;

  // Extract params from metadata context (already parsed)
  const search = awaitedSearchParams?.search || "";
  const sortBy = awaitedSearchParams?.sortBy || "views";
  const parsedFilters = pageContext.filters;
  const autoAI = awaitedSearchParams?.autoAI === "true";

  // Prefetch first page of cars using server action
  // ⚡ Direct database access - ultra-fast SSR!
  const initialResult = await queryClient.fetchInfiniteQuery({
    queryKey: ["cars", "infinite", search, parsedFilters, sortBy, 12],
    queryFn: ({ pageParam }) =>
      getCarsPageAction({
        pageParam,
        search,
        filters: parsedFilters,
        sortBy,
        pageSize: 12,
      }),
    initialPageParam: 1,
  });

  // 🎯 Smart search enhancement (3-tier system with complexity prediction)
  let enhancementResult = null;
  if (
    autoAI &&
    initialResult?.pages?.[0]?.totalCars === 0 &&
    hasValidQueryText(search)
  ) {
    console.log("🤖 [SmartSearch] No results - starting enhancement", {
      originalFilters: parsedFilters,
      search: search,
      autoAI: true,
    });

    // 🎯 Predict query complexity to decide tier strategy
    const prediction = predictQueryComplexity(search);
    console.log("🎯 [QueryPredictor]", {
      needsAI: prediction.needsAI,
      reason: prediction.reason,
      complexity: prediction.complexity,
    });

    // Execute smart search fallback chain (TIER 2 → TIER 3)
    const aiResult = await executeSmartSearchFallback(
      search,
      parsedFilters,
      prediction.needsAI // Skip TIER 2 if query is complex
    );

    if (aiResult?.success) {
      console.log("✅ [SmartSearch] AI successful:", {
        confidence: aiResult.metadata?.confidence,
        interpretation: aiResult.metadata?.interpretation,
        aiResultKeys: Object.keys(aiResult),
        hasSearch: !!aiResult.search,
        hasFilters: !!aiResult.filters,
        hasLte: !!aiResult.lte,
        hasGte: !!aiResult.gte,
      });

      console.log("🔍 [SmartSearch] AI result structure:", {
        search: aiResult.search,
        lte: aiResult.lte,
        gte: aiResult.gte,
        filters: aiResult.filters,
      });

      // Convert AI output to buildCarsQuery-compatible format
      const baseFilters = aiResult.filters || {};
      const priceFilters = buildPriceFiltersFromAI(aiResult.lte, aiResult.gte);
      const convertedFilters = { ...baseFilters, ...priceFilters };

      // Package enhanced result with converted search and filters
      enhancementResult = {
        ...aiResult,
        search: aiResult.search || [],
        filters: convertedFilters,
        success: true,
      };

      console.log("🔍 [SmartSearch] Converted AI output:", {
        search: aiResult.search,
        lte: aiResult.lte,
        gte: aiResult.gte,
        originalFilters: aiResult.filters,
        priceFilters: priceFilters,
        convertedFilters: convertedFilters,
      });

      // Prefetch AI-generated results
      await queryClient.prefetchInfiniteQuery({
        queryKey: [
          "cars",
          "infinite",
          aiResult.search,
          convertedFilters,
          sortBy,
          12,
        ],
        queryFn: ({ pageParam }) =>
          getCarsPageAction({
            pageParam,
            search: aiResult.search || [],
            filters: convertedFilters,
            sortBy,
            pageSize: 12,
          }),
        initialPageParam: 1,
      });
    } else {
      console.log("❌ [SmartSearch] No enhancement available");
    }
  }

  // Generate breadcrumbs on server-side
  const breadcrumbItems = generateBreadcrumbs("/cars", awaitedSearchParams);

  // Fetch webInfo for dynamic organization schema
  const webInfoResult = await getWebInfo();
  const webInfo = webInfoResult?.data || null;

  // Generate JSON-LD structured data with dynamic webInfo
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
  const organizationSchema = generateOrganizationSchema(webInfo);
  const searchActionSchema = generateSearchActionSchema();
  const webPageSchema = generateWebPageSchema(
    pageContext.seoTitle || metadataResult.metadata.title,
    metadataResult.metadata.description,
    buildSiteUrl("/cars")
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* JSON-LD Structured Data for SEO */}
      <StructuredDataScripts
        breadcrumbSchema={breadcrumbSchema}
        organizationSchema={organizationSchema}
        searchActionSchema={searchActionSchema}
        webPageSchema={webPageSchema}
      />

      <div className="pt-10 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumb Navigation - Server-side rendered */}
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <Suspense
            fallback={<SuspenseLoading message="กำลังโหลดรายการรถยนต์..." />}
          >
            <AllCarsPageClient
              searchParams={awaitedSearchParams}
              pageContext={pageContext}
              enhancementResult={enhancementResult}
            />
          </Suspense>
        </div>
      </div>
    </HydrationBoundary>
  );
}
