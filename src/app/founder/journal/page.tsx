/**
 * Journal Page
 *
 * Features:
 * - List of journal entries
 * - Create new entry button
 * - Search within entries
 * - Filter by business
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Plus,
  Search,
  FileText,
  Building2,
  Tag,
  X,
} from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  businessId?: string;
  businessName?: string;
  tags: string[];
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [loading, setLoading] = useState(true);

  // New entry form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newBusinessId, setNewBusinessId] = useState<string>('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockEntries: JournalEntry[] = [
      {
        id: '1',
        title: 'Q1 Strategy Review',
        content:
          'Reviewed Q1 performance across all businesses. Key takeaways:\n\n1. Balustrade Co. exceeded revenue targets by 15%\n2. Tech Startup needs focus on customer retention\n3. E-commerce Store performing well but needs inventory management improvement\n\nAction items: Schedule individual business reviews, implement new CRM for Tech Startup, evaluate inventory software for E-commerce.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['strategy', 'quarterly-review', 'performance'],
      },
      {
        id: '2',
        title: 'Marketing Budget Reallocation',
        content:
          'After reviewing AI Phill recommendations and current ROI data, decided to shift 20% of marketing budget from paid ads to content marketing.\n\nReasoning:\n- Content marketing showing 3x better ROI\n- SEO traffic growing organically\n- Brand awareness improving without paid spend\n\nNext steps: Brief content team on increased output expectations, set up tracking for content performance metrics.',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        businessId: '1',
        businessName: 'Balustrade Co.',
        tags: ['marketing', 'budget', 'content'],
      },
      {
        id: '3',
        title: 'Competitor Analysis Insights',
        content:
          'Deep dive into new Melbourne competitor. They\'re pricing 10% lower but lack our quality certifications.\n\nOpportunity: Emphasize our certifications and quality guarantees in marketing. Create comparison content showing value of certified products.\n\nRisk: Monitor their growth - if they gain significant market share, may need to adjust pricing strategy.',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        businessId: '1',
        businessName: 'Balustrade Co.',
        tags: ['competition', 'strategy', 'pricing'],
      },
      {
        id: '4',
        title: 'Team Expansion Thoughts',
        content:
          'Considering hiring a dedicated customer success manager for Tech Startup. Current support response times are too slow.\n\nCost-benefit:\n- Salary: ~$70k/year\n- Potential churn reduction: ~$150k/year\n- Customer satisfaction improvement: Priceless\n\nDecision: Move forward with hiring. Draft JD next week.',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        businessId: '2',
        businessName: 'Tech Startup',
        tags: ['hiring', 'customer-success', 'planning'],
      },
      {
        id: '5',
        title: 'Lessons from Failed Product Launch',
        content:
          'E-commerce Store\'s new product line didn\'t perform as expected. Key lessons:\n\n1. Should have validated demand with smaller test first\n2. Marketing timing was off (launched during slow season)\n3. Pricing wasn\'t competitive enough\n\nWhat to do differently next time:\n- Pre-launch survey to gauge interest\n- Time launches with seasonal demand\n- Competitive pricing analysis before setting prices\n- Smaller initial inventory commitment',
        timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        businessId: '3',
        businessName: 'E-commerce Store',
        tags: ['lessons-learned', 'product-launch', 'reflection'],
      },
    ];

    setEntries(mockEntries);
    setFilteredEntries(mockEntries);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = entries;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Business filter
    if (selectedBusiness !== 'all') {
      filtered = filtered.filter(
        (entry) => entry.businessId === selectedBusiness || !entry.businessId
      );
    }

    setFilteredEntries(filtered);
  }, [searchQuery, selectedBusiness, entries]);

  const businesses = [
    { id: 'all', name: 'All Entries' },
    { id: '1', name: 'Balustrade Co.' },
    { id: '2', name: 'Tech Startup' },
    { id: '3', name: 'E-commerce Store' },
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleSaveEntry = () => {
    // TODO: Save to database via API
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      timestamp: new Date().toISOString(),
      businessId: newBusinessId || undefined,
      businessName: newBusinessId
        ? businesses.find((b) => b.id === newBusinessId)?.name
        : undefined,
      tags: newTags,
    };

    setEntries([newEntry, ...entries]);
    setShowNewEntry(false);
    setNewTitle('');
    setNewContent('');
    setNewBusinessId('');
    setNewTags([]);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <Section>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Journal</h1>
            <p className="text-gray-400 mt-2">
              Record insights, decisions, and reflections about your businesses
            </p>
          </div>
          <Button
            onClick={() => setShowNewEntry(!showNewEntry)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </Section>

      {/* New Entry Form */}
      {showNewEntry && (
        <Section>
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">New Journal Entry</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Entry title..."
                  className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="business" className="text-gray-300">
                  Related Business (Optional)
                </Label>
                <select
                  id="business"
                  value={newBusinessId}
                  onChange={(e) => setNewBusinessId(e.target.value)}
                  className="mt-2 w-full h-10 px-3 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-md"
                >
                  <option value="">None</option>
                  {businesses.filter((b) => b.id !== 'all').map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="content" className="text-gray-300">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="What's on your mind? Record insights, decisions, or reflections..."
                  rows={8}
                  className="mt-2 bg-gray-900/50 border-gray-700 text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="tags" className="text-gray-300">
                  Tags
                </Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag and press Enter..."
                    className="flex-1 bg-gray-900/50 border-gray-700 text-gray-100"
                  />
                  <Button onClick={handleAddTag} variant="outline" className="border-gray-600">
                    Add
                  </Button>
                </div>
                {newTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-600/20 text-purple-400 text-sm rounded-md border border-purple-500/30 flex items-center"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-purple-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewEntry(false);
                    setNewTitle('');
                    setNewContent('');
                    setNewBusinessId('');
                    setNewTags([]);
                  }}
                  className="border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEntry}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Save Entry
                </Button>
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* Filters */}
      <Section>
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-gray-100"
              />
            </div>

            {/* Business filter */}
            <div>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="w-full h-10 px-3 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-md"
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </Section>

      {/* Entries List */}
      <Section>
        {filteredEntries.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">No entries found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Start documenting your business journey'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowNewEntry(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Entry
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="bg-gray-800/50 border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-100 mb-2">{entry.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(entry.timestamp)}
                      </span>
                      {entry.businessName && (
                        <span className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1" />
                          {entry.businessName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none mb-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{entry.content}</p>
                </div>

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded border border-gray-600 flex items-center"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
