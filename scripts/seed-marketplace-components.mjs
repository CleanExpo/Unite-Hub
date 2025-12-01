#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Template components
const templateComponents = [
  {
    name: "Modern Header",
    description: "Clean and modern header with navigation menu",
    category: "header",
    style_tag: "modern",
    component_code: `export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Logo</div>
        <ul className="flex gap-8">
          <li><a href="#" className="text-gray-600 hover:text-blue-600">Home</a></li>
          <li><a href="#" className="text-gray-600 hover:text-blue-600">About</a></li>
          <li><a href="#" className="text-gray-600 hover:text-blue-600">Contact</a></li>
        </ul>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Sign In</button>
      </nav>
    </header>
  );
}`,
    tailwind_classes: "bg-white border-b border-gray-200 flex justify-between items-center",
    has_dark_mode: true,
    accessibility_score: 95,
    performance_score: 98,
  },
  {
    name: "Hero Section",
    description: "Eye-catching hero section with call-to-action",
    category: "hero",
    style_tag: "minimalist",
    component_code: `export function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to Our Platform</h1>
        <p className="text-xl mb-8 opacity-90">Build amazing things with our tools</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">Get Started</button>
      </div>
    </section>
  );
}`,
    tailwind_classes: "bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center",
    has_dark_mode: false,
    accessibility_score: 92,
    performance_score: 99,
  },
  {
    name: "Feature Card",
    description: "Reusable card component for feature showcase",
    category: "card",
    style_tag: "minimalist",
    component_code: `export function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}`,
    tailwind_classes: "bg-white rounded-lg shadow-md p-6 hover:shadow-lg",
    has_dark_mode: true,
    accessibility_score: 90,
    performance_score: 99,
  },
  {
    name: "Contact Form",
    description: "Professional contact form with validation",
    category: "form",
    style_tag: "corporate",
    component_code: `export function ContactForm() {
  return (
    <form className="max-w-md mx-auto space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows="5"></textarea>
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Send</button>
    </form>
  );
}`,
    tailwind_classes: "max-w-md mx-auto space-y-4",
    has_dark_mode: true,
    accessibility_score: 94,
    performance_score: 99,
  },
  {
    name: "Footer",
    description: "Complete footer with links and information",
    category: "footer",
    style_tag: "corporate",
    component_code: `export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-3 gap-8">
        <div>
          <h4 className="font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Product</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white">Features</a></li>
            <li><a href="#" className="hover:text-white">Pricing</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-white">Privacy</a></li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}`,
    tailwind_classes: "bg-gray-900 text-white grid grid-cols-3 gap-8",
    has_dark_mode: false,
    accessibility_score: 91,
    performance_score: 99,
  },
];

// Collections
const collections = [
  {
    name: "Landing Page Essentials",
    description: "All components you need for a professional landing page",
    theme_color: "#3B82F6",
    is_featured: true,
  },
  {
    name: "SaaS Starter Kit",
    description: "Pre-built components for SaaS applications",
    theme_color: "#8B5CF6",
    is_featured: true,
  },
  {
    name: "Corporate Website",
    description: "Professional components for corporate sites",
    theme_color: "#1F2937",
    is_featured: false,
  },
];

async function seed() {
  try {
    console.log("🌱 Starting marketplace component seeding...\n");

    // Get the first workspace for seeding
    const { data: workspaces, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1);

    if (wsError || !workspaces || workspaces.length === 0) {
      console.error("❌ No workspaces found. Please create a workspace first.");
      process.exit(1);
    }

    const workspaceId = workspaces[0].id;
    console.log(`✅ Using workspace: ${workspaceId}\n`);

    // Get first user for created_by
    const { data: users } = await supabase.auth.admin.listUsers();
    if (!users || users.users.length === 0) {
      console.error("❌ No users found");
      process.exit(1);
    }
    const userId = users.users[0].id;

    // Insert components
    console.log("📦 Seeding components...");
    const { data: insertedComponents, error: compError } = await supabase
      .from("marketplace_components")
      .insert(
        templateComponents.map((comp) => ({
          ...comp,
          workspace_id: workspaceId,
          created_by: userId,
        }))
      )
      .select();

    if (compError) {
      console.error("❌ Error inserting components:", compError);
      process.exit(1);
    }

    console.log(`✅ Inserted ${insertedComponents?.length || 0} components\n`);

    // Insert collections
    console.log("🎨 Seeding collections...");
    const { data: insertedCollections, error: collError } = await supabase
      .from("component_collections")
      .insert(
        collections.map((coll) => ({
          ...coll,
          workspace_id: workspaceId,
          component_ids: (insertedComponents || [])
            .slice(0, 3)
            .map((c) => c.id),
        }))
      )
      .select();

    if (collError) {
      console.error("❌ Error inserting collections:", collError);
      process.exit(1);
    }

    console.log(`✅ Inserted ${insertedCollections?.length || 0} collections\n`);

    console.log("✨ Seeding complete!");
    console.log(
      `📊 Stats: ${insertedComponents?.length || 0} components, ${insertedCollections?.length || 0} collections`
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
