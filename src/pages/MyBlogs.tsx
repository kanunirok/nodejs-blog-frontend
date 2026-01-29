import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { blogApi, Blog } from '@/lib/api';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Calendar, PenLine, ExternalLink, Edit } from 'lucide-react';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MyBlogs() {
  const [page, setPage] = useState(1);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['my-blogs', page],
    queryFn: async () => {
      const response = await blogApi.getMyBlogs(page);
      if (response.data) {
        if (page === 1) {
          setBlogs(response.data.blogs);
        } else {
          setBlogs((prev) => [...prev, ...response.data!.blogs]);
        }
        return response.data;
      }
      throw new Error(response.error);
    },
  });

  const loadMore = () => {
    if (data && page < data.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">My Stories</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your blog posts
            </p>
          </div>
          <Button asChild>
            <Link to="/write" className="gap-2">
              <PenLine className="h-4 w-4" />
              Write new
            </Link>
          </Button>
        </div>

        {isLoading && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-lg border border-border">
                <Skeleton className="h-6 w-2/3 mb-3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <PenLine className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
            <p className="text-muted-foreground mb-6">
              Start writing your first blog post
            </p>
            <Button asChild>
              <Link to="/write">Write your first story</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {blogs.map((blog) => (
                <article
                  key={blog.id}
                  className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            blog.status === 'published' 
                              ? 'default' 
                              : blog.status === 'rejected'
                              ? 'destructive'
                              : blog.status === 'pending_approval'
                              ? 'secondary'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {blog.status === 'pending_approval' ? 'Pending Approval' : 
                           blog.status === 'rejected' ? 'Rejected' : 
                           blog.status}
                        </Badge>
                        {blog.status === 'rejected' && blog.rejectionReason && (
                          <span className="text-xs text-muted-foreground" title={blog.rejectionReason}>
                            
                          </span>
                        )}
                      </div>
                      {blog.status === 'rejected' && blog.rejectionReason && (
                        <p className="text-sm text-destructive mb-2"><b>Reason:</b> {blog.rejectionReason}</p>
                      )}

                      <h2 className="font-serif text-xl font-semibold text-foreground mb-2 line-clamp-1">
                        {blog.title}
                      </h2>

                      <p className="text-muted-foreground text-sm line-clamp-1 mb-3">
                        {blog.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(blog.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {blog.views} views
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button asChild variant="ghost" size="icon" title="Edit blog">
                        <Link to={`/write/${blog.slug}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" title="View blog">
                        <Link to={`/blog/${blog.slug}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {data && page < data.totalPages && (
              <div className="flex justify-center pt-8">
                <Button variant="outline" onClick={loadMore} disabled={isFetching}>
                  {isFetching ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
