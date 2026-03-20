import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

interface Hospital {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  rating?: number;
}

/** Hardcoded Hyderabad hospitals for demo when no API key is configured. */
const DEMO_HOSPITALS: Hospital[] = [
  {
    name: "Apollo Hospitals, Jubilee Hills",
    address: "Jubilee Hills, Hyderabad, Telangana 500033",
    lat: 17.4326,
    lng: 78.4071,
    phone: "+91-40-23607777",
    rating: 4.3,
  },
  {
    name: "KIMS Hospital",
    address: "Minister Road, Secunderabad, Telangana 500003",
    lat: 17.4399,
    lng: 78.4983,
    phone: "+91-40-44885000",
    rating: 4.1,
  },
  {
    name: "Yashoda Hospitals, Somajiguda",
    address: "Raj Bhavan Road, Somajiguda, Hyderabad 500082",
    lat: 17.4239,
    lng: 78.4538,
    phone: "+91-40-45674567",
    rating: 4.2,
  },
  {
    name: "Care Hospitals, Banjara Hills",
    address: "Road No. 1, Banjara Hills, Hyderabad 500034",
    lat: 17.4156,
    lng: 78.4424,
    phone: "+91-40-30418888",
    rating: 4.0,
  },
  {
    name: "Osmania General Hospital",
    address: "Afzalgunj, Hyderabad, Telangana 500012",
    lat: 17.3753,
    lng: 78.4744,
    phone: "+91-40-24600146",
    rating: 3.5,
  },
  {
    name: "Gandhi Hospital",
    address: "Musheerabad, Hyderabad, Telangana 500003",
    lat: 17.4012,
    lng: 78.4899,
    phone: "+91-40-27505566",
    rating: 3.4,
  },
  {
    name: "Nizam's Institute of Medical Sciences (NIMS)",
    address: "Panjagutta, Hyderabad, Telangana 500082",
    lat: 17.4215,
    lng: 78.4484,
    phone: "+91-40-23489000",
    rating: 4.0,
  },
  {
    name: "Continental Hospitals",
    address: "IT Park Road, Nanakramguda, Hyderabad 500032",
    lat: 17.4225,
    lng: 78.3816,
    phone: "+91-40-67000000",
    rating: 4.4,
  },
];

export async function GET(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

  // Rate limiting: 5 requests per minute per IP
  const rl = checkRateLimit(`hospitals:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    logger.warn("Rate limit exceeded", {
      ip: clientIp,
      endpoint: "/api/hospitals",
    });
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const radiusStr = searchParams.get("radius");

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { error: "Missing required query parameters: lat and lng" },
      { status: 400, headers: rateLimitHeaders(rl) }
    );
  }

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lngStr);
  const radius = radiusStr ? parseFloat(radiusStr) : 5000;

  if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
    return NextResponse.json(
      { error: "Invalid lat, lng, or radius values" },
      { status: 400, headers: rateLimitHeaders(rl) }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Fall back to demo data when no API key is configured
  if (!apiKey) {
    logger.info("Using demo hospital data (no GOOGLE_MAPS_API_KEY set)", {
      lat: latitude,
      lng: longitude,
    });
    return NextResponse.json(
      { hospitals: DEMO_HOSPITALS },
      { headers: rateLimitHeaders(rl) }
    );
  }

  try {
    logger.info("Searching nearby hospitals via Google Places API", {
      lat: latitude,
      lng: longitude,
      radius,
    });

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.location,places.rating,places.nationalPhoneNumbers",
        },
        body: JSON.stringify({
          includedTypes: ["hospital"],
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius,
            },
          },
          maxResultCount: 10,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Google Places API error", {
        status: response.status,
        body: errorBody,
      });
      return NextResponse.json(
        { error: "Failed to fetch nearby hospitals" },
        { status: 502, headers: rateLimitHeaders(rl) }
      );
    }

    const data = await response.json();
    const places = data.places ?? [];

    const hospitals: Hospital[] = places.map(
      (place: Record<string, unknown>) => {
        const location = place.location as
          | { latitude: number; longitude: number }
          | undefined;
        const displayName = place.displayName as
          | { text: string }
          | undefined;
        const phones = place.nationalPhoneNumbers as string[] | undefined;

        return {
          name: displayName?.text ?? "Unknown Hospital",
          address: (place.formattedAddress as string) ?? "",
          lat: location?.latitude ?? 0,
          lng: location?.longitude ?? 0,
          phone: phones?.[0],
          rating: place.rating as number | undefined,
        };
      }
    );

    logger.info("Hospital search complete", { resultCount: hospitals.length });

    return NextResponse.json(
      { hospitals },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    logger.error("Hospital search failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to search for hospitals. Please try again." },
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
