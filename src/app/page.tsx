import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Your Medical Records,{" "}
          <span className="text-primary">Unified & Life-Ready</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Upload messy prescriptions, lab reports, or describe your medical
          history. JeevanSetu uses Google Gemini AI to create a structured
          emergency medical profile — shareable instantly via QR code.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/upload" className="btn-primary text-lg">
            Upload Medical Records
          </Link>
          <Link href="/dashboard" className="btn-secondary text-lg">
            View Profiles
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4" aria-hidden="true">
              1
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Anything</h3>
            <p className="text-gray-600">
              Prescription photos, lab reports, medicine photos, or just type
              your medical history in plain language.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4" aria-hidden="true">
              2
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Extracts & Verifies</h3>
            <p className="text-gray-600">
              Gemini AI reads your documents, extracts medications, allergies,
              lab values, and flags critical findings.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4" aria-hidden="true">
              3
            </div>
            <h3 className="text-lg font-semibold mb-2">Share via QR Code</h3>
            <p className="text-gray-600">
              Generate a QR code for your emergency profile. Responders scan it
              to see your critical medical info instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Input types */}
      <section className="py-16 bg-white rounded-2xl mb-16 px-8" aria-labelledby="input-types">
        <h2 id="input-types" className="text-3xl font-bold text-center mb-12">
          We Handle Messy Inputs
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Prescriptions", desc: "Handwritten or printed (English)", status: "Ready" },
            { title: "Lab Reports", desc: "Blood tests, urine tests, etc.", status: "Ready" },
            { title: "Medicine Photos", desc: "Snap a photo of the strip/box", status: "Ready" },
            { title: "Text / Voice", desc: "Describe history in your words", status: "Ready" },
          ].map((item) => (
            <div key={item.title} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{item.title}</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          {[
            { title: "Telugu Prescriptions", status: "Coming Soon" },
            { title: "Hindi Prescriptions", status: "Coming Soon" },
          ].map((item) => (
            <div key={item.title} className="border border-dashed border-gray-300 rounded-lg p-4 opacity-60">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{item.title}</h3>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
