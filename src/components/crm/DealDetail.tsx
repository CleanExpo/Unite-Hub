'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DealDocumentsSection from '@/components/crm/DealDocumentsSection';

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
}

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]> 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DealDocumentsSection from '@/components/crm/DealDocumentsSection';

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
}

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchActivities();
  }, [deal.id]);

  const fetchComments = async () => {
    // Simulated API call
    setComments([
      {
        id: '1',
        content: 'We need to follow up with the client next week',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      }
    ]);
  };

  const fetchActivities = async () => {
    // Simulated API call
    setActivities([
      {
        id: '1',
        action: 'created',
        details: 'Deal created',
        created_at: deal.created_at,
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      },
      {
        id: '2',
        action: 'moved',
        details: 'Moved to Negotiation stage',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Sam Wilson',
          avatar_url: '',
        }
      }
    ]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // Simulated API call
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment,
        user_id: 'current_user',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'You',
          avatar_url: '',
        }
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deal: {deal.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">${deal.amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{deal.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={activity.user.avatar_url} />
                  <AvatarFallback>{activity.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{activity.user.full_name}</div>
                  <div className="text-sm">
                    {activity.action} - {activity.details}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex-1">
                  <div className="font-medium">{comment.user.full_name}</div>
                  <p>{comment.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              Unite Group="Add a comment..."
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
        <DealDocumentsSection dealId={deal.id} />
      </CardContent>
    </Card>
  );
}
.Value -replace "'", "'" <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deal: {deal.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium"> 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DealDocumentsSection from '@/components/crm/DealDocumentsSection';

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
}

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchActivities();
  }, [deal.id]);

  const fetchComments = async () => {
    // Simulated API call
    setComments([
      {
        id: '1',
        content: 'We need to follow up with the client next week',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      }
    ]);
  };

  const fetchActivities = async () => {
    // Simulated API call
    setActivities([
      {
        id: '1',
        action: 'created',
        details: 'Deal created',
        created_at: deal.created_at,
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      },
      {
        id: '2',
        action: 'moved',
        details: 'Moved to Negotiation stage',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Sam Wilson',
          avatar_url: '',
        }
      }
    ]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // Simulated API call
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment,
        user_id: 'current_user',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'You',
          avatar_url: '',
        }
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deal: {deal.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">${deal.amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{deal.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={activity.user.avatar_url} />
                  <AvatarFallback>{activity.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{activity.user.full_name}</div>
                  <div className="text-sm">
                    {activity.action} - {activity.details}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex-1">
                  <div className="font-medium">{comment.user.full_name}</div>
                  <p>{comment.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              Unite Group="Add a comment..."
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
        <DealDocumentsSection dealId={deal.id} />
      </CardContent>
    </Card>
  );
}
.Value -replace "'", "'" </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p> 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DealDocumentsSection from '@/components/crm/DealDocumentsSection';

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
}

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchActivities();
  }, [deal.id]);

  const fetchComments = async () => {
    // Simulated API call
    setComments([
      {
        id: '1',
        content: 'We need to follow up with the client next week',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      }
    ]);
  };

  const fetchActivities = async () => {
    // Simulated API call
    setActivities([
      {
        id: '1',
        action: 'created',
        details: 'Deal created',
        created_at: deal.created_at,
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      },
      {
        id: '2',
        action: 'moved',
        details: 'Moved to Negotiation stage',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Sam Wilson',
          avatar_url: '',
        }
      }
    ]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // Simulated API call
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment,
        user_id: 'current_user',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'You',
          avatar_url: '',
        }
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deal: {deal.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">${deal.amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{deal.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={activity.user.avatar_url} />
                  <AvatarFallback>{activity.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{activity.user.full_name}</div>
                  <div className="text-sm">
                    {activity.action} - {activity.details}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex-1">
                  <div className="font-medium">{comment.user.full_name}</div>
                  <p>{comment.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              Unite Group="Add a comment..."
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
        <DealDocumentsSection dealId={deal.id} />
      </CardContent>
    </Card>
  );
}
.Value -replace "'", "'" </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={activity.user.avatar_url} />
                  <AvatarFallback>{activity.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{activity.user.full_name}</div>
                  <div className="text-sm">
                    {activity.action} - {activity.details}
                  </div>
                  <div className="text-xs text-gray-500"> 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DealDocumentsSection from '@/components/crm/DealDocumentsSection';

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
}

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchActivities();
  }, [deal.id]);

  const fetchComments = async () => {
    // Simulated API call
    setComments([
      {
        id: '1',
        content: 'We need to follow up with the client next week',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      }
    ]);
  };

  const fetchActivities = async () => {
    // Simulated API call
    setActivities([
      {
        id: '1',
        action: 'created',
        details: 'Deal created',
        created_at: deal.created_at,
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      },
      {
        id: '2',
        action: 'moved',
        details: 'Moved to Negotiation stage',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Sam Wilson',
          avatar_url: '',
        }
      }
    ]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // Simulated API call
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment,
        user_id: 'current_user',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'You',
          avatar_url: '',
        }
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deal: {deal.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">${deal.amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{deal.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={activity.user.avatar_url} />
                  <AvatarFallback>{activity.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{activity.user.full_name}</div>
                  <div className="text-sm">
                    {activity.action} - {activity.details}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex-1">
                  <div className="font-medium">{comment.user.full_name}</div>
                  <p>{comment.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              Unite Group="Add a comment..."
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
        <DealDocumentsSection dealId={deal.id} />
      </CardContent>
    </Card>
  );
}
.Value -replace "'", "'" </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex-1">
                  <div className="font-medium">{comment.user.full_name}</div>
                  <p>{comment.content}</p>
                  <div className="text-xs text-gray-500"> 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DealDocumentsSection from '@/components/crm/DealDocumentsSection';

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
}

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchActivities();
  }, [deal.id]);

  const fetchComments = async () => {
    // Simulated API call
    setComments([
      {
        id: '1',
        content: 'We need to follow up with the client next week',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      }
    ]);
  };

  const fetchActivities = async () => {
    // Simulated API call
    setActivities([
      {
        id: '1',
        action: 'created',
        details: 'Deal created',
        created_at: deal.created_at,
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      },
      {
        id: '2',
        action: 'moved',
        details: 'Moved to Negotiation stage',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Sam Wilson',
          avatar_url: '',
        }
      }
    ]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // Simulated API call
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment,
        user_id: 'current_user',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'You',
          avatar_url: '',
        }
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deal: {deal.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">${deal.amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{deal.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={activity.user.avatar_url} />
                  <AvatarFallback>{activity.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{activity.user.full_name}</div>
                  <div className="text-sm">
                    {activity.action} - {activity.details}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex-1">
                  <div className="font-medium">{comment.user.full_name}</div>
                  <p>{comment.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              Unite Group="Add a comment..."
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
        <DealDocumentsSection dealId={deal.id} />
      </CardContent>
    </Card>
  );
}
.Value -replace "'", "'" </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              Unite Group="Add a comment..."
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || loading}
            > 'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DealDocumentsSection from '@/components/crm/DealDocumentsSection';

interface Deal {
  id: string;
  title: string;
  stage_id: string;
  amount: number | null;
  description: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface Activity {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string;
  };
}

interface DealDetailProps {
  deal: Deal;
  onClose: () => void;
}

export default function DealDetail({ deal, onClose }: DealDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchActivities();
  }, [deal.id]);

  const fetchComments = async () => {
    // Simulated API call
    setComments([
      {
        id: '1',
        content: 'We need to follow up with the client next week',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      }
    ]);
  };

  const fetchActivities = async () => {
    // Simulated API call
    setActivities([
      {
        id: '1',
        action: 'created',
        details: 'Deal created',
        created_at: deal.created_at,
        user: {
          full_name: 'Alex Johnson',
          avatar_url: '',
        }
      },
      {
        id: '2',
        action: 'moved',
        details: 'Moved to Negotiation stage',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'Sam Wilson',
          avatar_url: '',
        }
      }
    ]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // Simulated API call
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment,
        user_id: 'current_user',
        created_at: new Date().toISOString(),
        user: {
          full_name: 'You',
          avatar_url: '',
        }
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deal: {deal.title}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">${deal.amount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p>{deal.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={activity.user.avatar_url} />
                  <AvatarFallback>{activity.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{activity.user.full_name}</div>
                  <div className="text-sm">
                    {activity.action} - {activity.details}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Comments</h3>
          <div className="space-y-4 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback>{comment.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3 flex-1">
                  <div className="font-medium">{comment.user.full_name}</div>
                  <p>{comment.content}</p>
                  <div className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              Unite Group="Add a comment..."
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
        <DealDocumentsSection dealId={deal.id} />
      </CardContent>
    </Card>
  );
}
.Value -replace "'", "'" </Button>
          </div>
        </div>
        <DealDocumentsSection dealId={deal.id} />
      </CardContent>
    </Card>
  );
}
