"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailSidebar } from "@/components/crm/email/email-sidebar"
import { EmailThreadView } from "@/components/crm/email/email-thread-view"
import { EmailComposer } from "@/components/crm/email/email-composer"
import { EmailTemplatesManager } from "@/components/crm/email/email-templates-manager"

export default function EmailPage({
  params,
}: {
  params?: { threadId?: string }
}) {
  const [activeTab, setActiveTab] = useState<string>("inbox")
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(params?.threadId)
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b">
        <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="inbox" className="h-full m-0 p-0">
            <div className="flex h-full">
              <EmailSidebar selectedThreadId={selectedThreadId} onComposeClick={() => setIsComposerOpen(true)} />

              <div className="flex-1 overflow-hidden">
                {selectedThreadId ? (
                  <EmailThreadView threadId={selectedThreadId} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-lg font-medium">No email selected</h3>
                      <p className="text-muted-foreground">Select an email from the sidebar or compose a new message</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="h-full m-0 p-6 overflow-auto">
            <EmailTemplatesManager />
          </TabsContent>

          <TabsContent value="settings" className="h-full m-0 p-6 overflow-auto">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Email Settings</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Connected Email Accounts</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your email accounts to send and receive emails directly from the CRM.
                  </p>

                  {/* Placeholder for connected accounts */}
                  <div className="bg-gray-50 border rounded-lg p-6 text-center">
                    <p className="text-muted-foreground mb-4">No email accounts connected yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your Gmail, Outlook, or custom SMTP server to get started
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Email Signature</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a professional email signature that will be added to all outgoing emails.
                  </p>

                  {/* Placeholder for signature editor */}
                  <div className="bg-gray-50 border rounded-lg p-6 text-center">
                    <p className="text-muted-foreground">No signature configured</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                  <p className="text-muted-foreground mb-4">
                    Configure how you want to be notified about new emails and responses.
                  </p>

                  {/* Placeholder for notification settings */}
                  <div className="bg-gray-50 border rounded-lg p-6 text-center">
                    <p className="text-muted-foreground">Notification settings will be available soon</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EmailComposer isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} />
    </div>
  )
}
