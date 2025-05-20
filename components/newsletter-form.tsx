"use client"

import type React from "react"

import { useState } from "react"

const NewsletterForm = () => {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!email) {
      setStatus("error")
      setMessage("Please enter your email address.")
      return
    }

    setStatus("submitting")
    setMessage("")

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Successfully subscribed to newsletter!")
        setEmail("") // Clear the input field on success
      } else {
        setStatus("error")
        setMessage(data.error || "An error occurred. Please try again.")
      }
    } catch (error: any) {
      setStatus("error")
      setMessage("An unexpected error occurred. Please try again later.")
      console.error("Newsletter subscription error:", error)
    }
  }

  return (
    <div className="bg-gray-100 py-6 rounded-md shadow-md">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Subscribe to Our Newsletter</h2>
        <p className="text-gray-700 mb-4 text-center">
          Stay up-to-date with the latest news, updates, and exclusive offers.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full md:w-auto px-4 py-2 rounded-md mr-2 mb-2 md:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline ${
              status === "submitting" ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {status === "submitting" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
        {message && (
          <div className={`mt-4 text-center ${status === "success" ? "text-green-500" : "text-red-500"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewsletterForm
