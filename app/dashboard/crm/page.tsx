import Image from "next/image"

export default function CRMPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Relationship Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Example CRM Card */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Client Meeting</h2>
          <Image
            src="/client-meeting.png"
            alt="Client meeting"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="mt-2">Discussing project milestones and future strategies.</p>
        </div>

        {/* Example CRM Card */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Sales Pipeline Review</h2>
          <Image
            src="/sales-pipeline.png"
            alt="Sales pipeline"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="mt-2">Reviewing current sales opportunities and identifying potential leads.</p>
        </div>

        {/* Example CRM Card */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Customer Support Tickets</h2>
          <Image
            src="/customer-support.png"
            alt="Customer support"
            width={300}
            height={200}
            className="rounded-lg object-cover"
          />
          <p className="mt-2">Addressing customer inquiries and resolving technical issues.</p>
        </div>
      </div>
    </div>
  )
}
