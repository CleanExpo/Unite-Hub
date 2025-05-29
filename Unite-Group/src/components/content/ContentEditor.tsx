"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tag, X, Save, Eye, Upload } from "lucide-react";
import { 
  ContentType, 
  ContentStatus, 
  ContentVisibility,
  BaseContent,
  BlogPost,
  CaseStudy,
  KnowledgeBaseArticle,
  Resource,
  Testimonial
} from "@/lib/content/types";
import { parseMarkdown, calculateReadingTime } from '@/lib/content/markdown';

interface ContentEditorProps {
  initialContent?: Partial<BaseContent>;
  contentType: ContentType;
  onSave: (content: any) => Promise<void>;
  onCancel: () => void;
}

/**
 * Content Editor Component
 * A comprehensive editor for creating and editing content items
 */
export default function ContentEditor({ 
  initialContent, 
  contentType, 
  onSave, 
  onCancel 
}: ContentEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [currentTag, setCurrentTag] = useState('');
  
  // Base content state
  const [content, setContent] = useState<Partial<BaseContent>>({
    title: '',
    description: '',
    content: '',
    status: 'draft' as ContentStatus,
    visibility: 'public' as ContentVisibility,
    type: contentType,
    tags: [],
    ...initialContent
  });
  
  // Content-specific state
  const [blogFields, setBlogFields] = useState<Partial<BlogPost>>({
    category: '',
    excerpt: '',
    isFeature: false
  });
  
  const [caseStudyFields, setCaseStudyFields] = useState<Partial<CaseStudy>>({
    client: '',
    industry: '',
    services: [],
    challenge: '',
    solution: '',
    results: '',
    duration: ''
  });
  
  const [knowledgeBaseFields, setKnowledgeBaseFields] = useState<Partial<KnowledgeBaseArticle>>({
    category: '',
    difficulty: 'beginner'
  });
  
  const [resourceFields, setResourceFields] = useState<Partial<Resource>>({
    resourceType: 'pdf',
    downloadRequired: false,
    category: ''
  });
  
  const [testimonialFields, setTestimonialFields] = useState<Partial<Testimonial>>({
    clientName: '',
    clientTitle: '',
    clientCompany: '',
    featured: false
  });
  
  // Load content-specific fields from initialContent
  useEffect(() => {
    if (initialContent) {
      if (contentType === 'blog' && 'category' in initialContent) {
        setBlogFields({
          ...blogFields,
          ...(initialContent as Partial<BlogPost>)
        });
      } else if (contentType === 'case-study' && 'client' in initialContent) {
        setCaseStudyFields({
          ...caseStudyFields,
          ...(initialContent as Partial<CaseStudy>)
        });
      } else if (contentType === 'knowledge-base' && 'difficulty' in initialContent) {
        setKnowledgeBaseFields({
          ...knowledgeBaseFields,
          ...(initialContent as Partial<KnowledgeBaseArticle>)
        });
      } else if (contentType === 'resource' && 'resourceType' in initialContent) {
        setResourceFields({
          ...resourceFields,
          ...(initialContent as Partial<Resource>)
        });
      } else if (contentType === 'testimonial' && 'clientName' in initialContent) {
        setTestimonialFields({
          ...testimonialFields,
          ...(initialContent as Partial<Testimonial>)
        });
      }
    }
  }, [initialContent, contentType]);
  
  // Update preview when content changes
  useEffect(() => {
    const updatePreview = async () => {
      if (content.content) {
        try {
          const html = await parseMarkdown(content.content);
          setPreview(html);
        } catch (error) {
          console.error('Error parsing markdown:', error);
        }
      } else {
        setPreview('');
      }
    };
    
    updatePreview();
  }, [content.content]);
  
  // Handle basic content changes
  const handleContentChange = (field: keyof BaseContent, value: any) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle blog-specific field changes
  const handleBlogChange = (field: keyof BlogPost, value: any) => {
    setBlogFields(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle case study-specific field changes
  const handleCaseStudyChange = (field: keyof CaseStudy, value: any) => {
    setCaseStudyFields(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle knowledge base-specific field changes
  const handleKnowledgeBaseChange = (field: keyof KnowledgeBaseArticle, value: any) => {
    setKnowledgeBaseFields(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle resource-specific field changes
  const handleResourceChange = (field: keyof Resource, value: any) => {
    setResourceFields(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle testimonial-specific field changes
  const handleTestimonialChange = (field: keyof Testimonial, value: any) => {
    setTestimonialFields(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add a tag to the list
  const addTag = () => {
    if (currentTag && !content.tags?.includes(currentTag)) {
      setContent(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag]
      }));
      setCurrentTag('');
    }
  };
  
  // Remove a tag from the list
  const removeTag = (tag: string) => {
    setContent(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };
  
  // Save the content
  const handleSave = async (shouldPublish: boolean = false) => {
    // Validate required fields
    if (!content.title || !content.content) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (title and content).",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare content for saving
      const finalContent = {
        ...content,
        status: shouldPublish ? 'published' as ContentStatus : content.status,
        updatedAt: new Date().toISOString(),
        publishedAt: shouldPublish ? new Date().toISOString() : content.publishedAt,
      };
      
      // Add content-specific fields
      let contentToSave: any = finalContent;
      
      switch (contentType) {
        case 'blog':
          // Add calculated reading time if not specified
          if (!blogFields.readingTime && content.content) {
            blogFields.readingTime = calculateReadingTime(content.content);
          }
          
          // Add excerpt if not specified
          if (!blogFields.excerpt && content.description) {
            blogFields.excerpt = content.description;
          }
          
          contentToSave = {
            ...finalContent,
            ...blogFields,
          };
          break;
          
        case 'case-study':
          contentToSave = {
            ...finalContent,
            ...caseStudyFields,
          };
          break;
          
        case 'knowledge-base':
          contentToSave = {
            ...finalContent,
            ...knowledgeBaseFields,
            lastReviewed: new Date().toISOString(),
          };
          break;
          
        case 'resource':
          contentToSave = {
            ...finalContent,
            ...resourceFields,
          };
          break;
          
        case 'testimonial':
          contentToSave = {
            ...finalContent,
            ...testimonialFields,
          };
          break;
      }
      
      // Save content
      await onSave(contentToSave);
      
      toast({
        title: shouldPublish ? "Content published" : "Content saved",
        description: shouldPublish 
          ? "Your content has been published successfully." 
          : "Your content has been saved as a draft.",
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error saving content",
        description: "An error occurred while saving your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render content-specific fields based on content type
  const renderContentTypeFields = () => {
    switch (contentType) {
      case 'blog':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={blogFields.category || ''}
                onChange={(e) => handleBlogChange('category', e.target.value)}
                placeholder="E.g., Technology, Marketing, Business"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeature"
                checked={blogFields.isFeature || false}
                onCheckedChange={(checked) => handleBlogChange('isFeature', checked)}
              />
              <Label htmlFor="isFeature">Feature this post</Label>
            </div>
          </div>
        );
        
      case 'case-study':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Client Name</Label>
              <Input
                id="client"
                value={caseStudyFields.client || ''}
                onChange={(e) => handleCaseStudyChange('client', e.target.value)}
                placeholder="Client name"
              />
            </div>
            
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={caseStudyFields.industry || ''}
                onChange={(e) => handleCaseStudyChange('industry', e.target.value)}
                placeholder="E.g., Healthcare, Finance, Retail"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={caseStudyFields.duration || ''}
                onChange={(e) => handleCaseStudyChange('duration', e.target.value)}
                placeholder="E.g., 3 months, 1 year"
              />
            </div>
            
            <div>
              <Label htmlFor="challenge">Challenge</Label>
              <Textarea
                id="challenge"
                value={caseStudyFields.challenge || ''}
                onChange={(e) => handleCaseStudyChange('challenge', e.target.value)}
                placeholder="Describe the challenge faced by the client"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="solution">Solution</Label>
              <Textarea
                id="solution"
                value={caseStudyFields.solution || ''}
                onChange={(e) => handleCaseStudyChange('solution', e.target.value)}
                placeholder="Describe the solution provided"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="results">Results</Label>
              <Textarea
                id="results"
                value={caseStudyFields.results || ''}
                onChange={(e) => handleCaseStudyChange('results', e.target.value)}
                placeholder="Describe the results achieved"
                rows={3}
              />
            </div>
          </div>
        );
        
      case 'knowledge-base':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={knowledgeBaseFields.category || ''}
                onChange={(e) => handleKnowledgeBaseChange('category', e.target.value)}
                placeholder="E.g., Getting Started, Troubleshooting"
              />
            </div>
            
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={knowledgeBaseFields.difficulty || 'beginner'}
                onValueChange={(value) => handleKnowledgeBaseChange('difficulty', value as 'beginner' | 'intermediate' | 'advanced')}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 'resource':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select
                value={resourceFields.resourceType || 'pdf'}
                onValueChange={(value) => handleResourceChange('resourceType', value as 'pdf' | 'video' | 'audio' | 'presentation' | 'template' | 'other')}
              >
                <SelectTrigger id="resourceType">
                  <SelectValue placeholder="Select resource type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={resourceFields.category || ''}
                onChange={(e) => handleResourceChange('category', e.target.value)}
                placeholder="E.g., Guides, Templates, Tools"
              />
            </div>
            
            <div>
              <Label htmlFor="fileUrl">File URL</Label>
              <Input
                id="fileUrl"
                value={resourceFields.fileUrl || ''}
                onChange={(e) => handleResourceChange('fileUrl', e.target.value)}
                placeholder="URL to the resource file"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="downloadRequired"
                checked={resourceFields.downloadRequired || false}
                onCheckedChange={(checked) => handleResourceChange('downloadRequired', checked)}
              />
              <Label htmlFor="downloadRequired">Download required</Label>
            </div>
          </div>
        );
        
      case 'testimonial':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={testimonialFields.clientName || ''}
                onChange={(e) => handleTestimonialChange('clientName', e.target.value)}
                placeholder="Client name"
              />
            </div>
            
            <div>
              <Label htmlFor="clientTitle">Client Title</Label>
              <Input
                id="clientTitle"
                value={testimonialFields.clientTitle || ''}
                onChange={(e) => handleTestimonialChange('clientTitle', e.target.value)}
                placeholder="E.g., CEO, Marketing Director"
              />
            </div>
            
            <div>
              <Label htmlFor="clientCompany">Client Company</Label>
              <Input
                id="clientCompany"
                value={testimonialFields.clientCompany || ''}
                onChange={(e) => handleTestimonialChange('clientCompany', e.target.value)}
                placeholder="Company name"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={testimonialFields.featured || false}
                onCheckedChange={(checked) => handleTestimonialChange('featured', checked)}
              />
              <Label htmlFor="featured">Feature this testimonial</Label>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            {initialContent?.id ? 'Edit' : 'Create'} {contentType.replace('-', ' ')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title*</Label>
                  <Input
                    id="title"
                    value={content.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    placeholder="Enter title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={content.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    placeholder="Enter a brief description"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Content*</Label>
                  <Textarea
                    id="content"
                    value={content.content || ''}
                    onChange={(e) => handleContentChange('content', e.target.value)}
                    placeholder="Enter content in Markdown format"
                    rows={15}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Markdown formatting supported
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="tag-input"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Tag className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {content.tags && content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {content.tags.map((tag) => (
                        <div
                          key={tag}
                          className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm flex items-center"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                            aria-label={`Remove tag ${tag}`}
                            title={`Remove tag ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {renderContentTypeFields()}
              </div>
            </TabsContent>
            
            <TabsContent value="preview">
              <div className="border rounded-md p-6 min-h-[400px] prose dark:prose-invert max-w-none">
                {preview ? (
                  <div dangerouslySetInnerHTML={{ __html: preview }} />
                ) : (
                  <p className="text-muted-foreground">No content to preview</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={content.status || 'draft'}
                  onValueChange={(value) => handleContentChange('status', value as ContentStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={content.visibility || 'public'}
                  onValueChange={(value) => handleContentChange('visibility', value as ContentVisibility)}
                >
                  <SelectTrigger id="visibility">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="members-only">Members Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  value={content.featuredImage || ''}
                  onChange={(e) => handleContentChange('featuredImage', e.target.value)}
                  placeholder="URL to featured image"
                />
              </div>
              
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={content.seoTitle || ''}
                  onChange={(e) => handleContentChange('seoTitle', e.target.value)}
                  placeholder="SEO title (defaults to content title)"
                />
              </div>
              
              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={content.seoDescription || ''}
                  onChange={(e) => handleContentChange('seoDescription', e.target.value)}
                  placeholder="SEO description (defaults to content description)"
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isSaving}
            >
              <Upload className="h-4 w-4 mr-2" />
              {content.status === 'published' ? 'Update' : 'Publish'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
