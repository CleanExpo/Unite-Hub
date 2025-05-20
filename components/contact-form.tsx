"use client"

import type React from "react"

import { useState } from "react"

const ContactForm = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [organisation, setOrganisation] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic form validation
    if (!name || !email || !message) {
      setStatus("error")
      setStatusMessage("Please fill in all required fields.")
      return
    }

    setStatus("submitting")
    setStatusMessage("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, organisation, message }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setStatusMessage("Your message has been sent successfully. We'll get back to you soon!")
        // Clear the form
        setName("")
        setEmail("")
        setPhone("")
        setOrganisation("")
        setMessage("")
      } else {
        setStatus("error")
        setStatusMessage(data.error || "Failed to send message. Please try again later.")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setStatus("error")
      setStatusMessage("An unexpected error occurred. Please try again later.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      {status === "success" && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">{statusMessage}</div>
      )}

      {status === "error" && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{statusMessage}</div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
          Name: <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
          Email: <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
          Phone:
        </label>
        <input
          type="tel"
          id="phone"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="organisation" className="block text-gray-700 text-sm font-bold mb-2">
          Organisation:
        </label>
        <input
          type="text"
          id="organisation"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={organisation}
          onChange={(e) => setOrganisation(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">
          Message: <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        ></textarea>
      </div>

      <div className="flex items-center justify-between">
        <button
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            status === "submitting" ? "opacity-50 cursor-not-allowed" : ""
          }`}
          type="submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  )
}

export default ContactForm
