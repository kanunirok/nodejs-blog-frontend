import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blogApi, Blog } from '@/lib/api';
import { Header } from '@/components/Header';
import { BlogCard } from '@/components/BlogCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';

export default function Home() {
  const [page, setPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['blogs', page, selectedTag],
    queryFn: async () => {
      const response = await blogApi.getBlogs(page, 'published', selectedTag);
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

  const { data: tagSuggestions } = useQuery({
    queryKey: ['tagSearch', tagSearch],
    queryFn: async () => {
      if (tagSearch.length < 1) return [];
      const response = await blogApi.searchTags(tagSearch);
      return response.data || [];
    },
    enabled: tagSearch.length >= 1,
  });

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    setTagSearch('');
    setPage(1);
    setBlogs([]);
  };

  const clearTagFilter = () => {
    setSelectedTag('');
    setPage(1);
    setBlogs([]);
  };

  const loadMore = () => {
    if (data && page < data.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground mb-4">
            Stories that matter
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Discover ideas, perspectives, and expertise from writers on any topic.
          </p>
        </section>

        {/* Tag Search */}
        <section className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by tag..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="pl-10"
            />

            {tagSuggestions && tagSuggestions.length > 0 && tagSearch && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                <ul className="py-1">
                  {tagSuggestions.map((tag) => (
                    <li
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {selectedTag && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              <Badge variant="secondary" className="gap-1">
                {selectedTag}
                <button onClick={clearTagFilter} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </section>

        {/* Blog List */}
        <section>
          {isLoading && page === 1 ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 border-b border-border pb-8">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {selectedTag
                  ? `No blogs found with tag "${selectedTag}"`
                  : 'No blogs published yet. Be the first to share your story!'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>

              {data && page < data.totalPages && (
                <div className="flex justify-center pt-12">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={loadMore}
                    disabled={isFetching}
                  >
                    {isFetching ? 'Loading...' : 'Load more stories'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
