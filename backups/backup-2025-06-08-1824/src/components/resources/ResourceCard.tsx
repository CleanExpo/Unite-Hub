"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  FileSpreadsheet, 
  CheckSquare, 
  Book, 
  BookOpen, 
  Briefcase,
  Download,
  Eye,
  Lock
} from "lucide-react";
import { Resource, RESOURCE_TYPE_LABELS } from "@/types/resources";
import { formatFileSize } from "@/lib/services/resources";

interface ResourceCardProps {
  resource: Resource;
  featured?: boolean;
}

const iconMap = {
  whitepaper: FileText,
  template: FileSpreadsheet,
  checklist: CheckSquare,
  ebook: Book,
  guide: BookOpen,
  case_study: Briefcase
};

export function ResourceCard({ resource, featured = false }: ResourceCardProps) {
  const Icon = iconMap[resource.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className={`h-full bg-slate-800 border-slate-700 hover:border-teal-600 transition-all hover:shadow-xl group overflow-hidden ${
        featured ? 'md:col-span-2 lg:col-span-1' : ''
      }`}>
        <Link href={`/resources/${resource.slug}`} className="block h-full">
          {/* Thumbnail */}
          {resource.thumbnail_url ? (
            <div className="relative h-48 md:h-56 overflow-hidden">
              <Image
                src={resource.thumbnail_url}
                alt={resource.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                    Featured
                  </Badge>
                </div>
              )}
              {resource.category && (
                <div className="absolute bottom-4 left-4">
                  <Badge 
                    style={{ backgroundColor: resource.category.color }}
                    className="text-white"
                  >
                    {resource.category.name}
                  </Badge>
                </div>
              )}
              {/* Type Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-slate-900/80 text-white">
                  {RESOURCE_TYPE_LABELS[resource.type]}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="relative h-48 md:h-56 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <Icon className="h-24 w-24 text-slate-600" />
              {featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                    Featured
                  </Badge>
                </div>
              )}
              {/* Type Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-slate-900/80 text-white">
                  {RESOURCE_TYPE_LABELS[resource.type]}
                </Badge>
              </div>
            </div>
          )}

          <CardContent className="p-6 flex flex-col h-full">
            {/* Title */}
            <h3 className={`font-bold text-white mb-3 group-hover:text-teal-400 transition-colors ${
              featured ? 'text-2xl' : 'text-xl'
            }`}>
              {resource.title}
            </h3>

            {/* Description */}
            <p className="text-slate-300 mb-4 flex-grow line-clamp-3">
              {resource.description}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
              {resource.page_count && (
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{resource.page_count} pages</span>
                </div>
              )}
              {resource.file_size && (
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{formatFileSize(resource.file_size)}</span>
                </div>
              )}
              {resource.download_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{resource.download_count.toLocaleString()} downloads</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {resource.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{resource.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Download Button */}
            <div className="mt-auto pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-400 group-hover:text-teal-300 font-medium">
                  <Download className="h-4 w-4" />
                  <span>Download {resource.requires_form ? 'Free' : 'Now'}</span>
                </div>
                {(resource.requires_auth || resource.requires_form) && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Lock className="h-3 w-3" />
                    <span>{resource.requires_auth ? 'Login required' : 'Form required'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Author */}
            {resource.author && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  {resource.author.avatar_url ? (
                    <Image
                      src={resource.author.avatar_url}
                      alt={resource.author.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600" />
                  )}
                  <span className="text-sm text-slate-400">by {resource.author.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}
