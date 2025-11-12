"use client";

import React, { useState } from "react";
import { EmailList } from "@/components/email/EmailList";
import { EmailThread } from "@/components/email/EmailThread";
import { EmailAddressManager } from "@/components/email/EmailAddressManager";
import { Mail, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EmailsPage() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();

  // TODO: Replace with actual Convex data
  const mockEmails = [
    {
      _id: "1",
      senderEmail: "john@example.com",
      senderName: "John Doe",
      subject: "Inquiry about your services",
      messageBody: "<p>Hi, I'm interested in learning more about your services...</p>",
      receivedAt: Date.now() - 7200000,
      autoReplySent: true,
      isRead: false,
      attachments: [],
    },
  ];

  const mockEmailAddresses = [
    {
      _id: "1",
      emailAddress: "contact@unite-group.in",
      isPrimary: true,
      verified: true,
      linkedAt: Date.now(),
    },
  ];

  const selectedEmail = mockEmails.find((e) => e._id === selectedEmailId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emails</h1>
          <p className="text-gray-600 mt-1">AI-powered email management and auto-replies</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Email Settings
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="addresses">Email Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 h-[700px] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Inbox ({mockEmails.length})
                </h2>
              </div>
              <EmailList
                emails={mockEmails}
                selectedEmailId={selectedEmailId}
                onSelectEmail={setSelectedEmailId}
              />
            </div>

            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[700px]">
              {selectedEmail ? (
                <EmailThread email={selectedEmail} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select an email to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <EmailAddressManager
            emails={mockEmailAddresses}
            onAddEmail={async (email, label) => {
              console.log("Add email:", email, label);
            }}
            onRemoveEmail={async (emailId) => {
              console.log("Remove email:", emailId);
            }}
            onSetPrimary={async (emailId) => {
              console.log("Set primary:", emailId);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
