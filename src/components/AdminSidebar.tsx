import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  BarChart3, 
  Eye, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface BusinessCard {
  id: string;
  title: string | null;
  company: string | null;
  is_published: boolean;
  view_count: number;
  slug: string | null;
  updated_at: string;
}

interface Analytics {
  totalViews: number;
  publishedCards: number;
  totalCards: number;
}

interface AdminSidebarProps {
  onCreateCard: () => void;
  onEditCard: (cardId: string) => void;
  onTabChange: (tab: 'cards' | 'create' | 'analytics') => void;
  activeTab: 'cards' | 'create' | 'analytics';
  className?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onCreateCard,
  onEditCard,
  onTabChange,
  activeTab,
  className = ''
}) => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalViews: 0,
    publishedCards: 0,
    totalCards: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load user's cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('business_cards')
        .select('id, title, company, is_published, view_count, slug, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (cardsError) {
        console.error('Error loading cards:', cardsError);
        return;
      }

      setCards(cardsData || []);

      // Calculate analytics
      const totalCards = cardsData?.length || 0;
      const publishedCards = cardsData?.filter(card => card.is_published).length || 0;
      const totalViews = cardsData?.reduce((sum, card) => sum + (card.view_count || 0), 0) || 0;

      setAnalytics({
        totalViews,
        publishedCards,
        totalCards
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCard = (slug: string | null) => {
    if (slug) {
      window.open(`/c/${slug}`, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {/* My Cards Section */}
          <button
            onClick={() => onTabChange('cards')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
              activeTab === 'cards'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <CreditCard className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="font-medium">My Cards</span>
                <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {cards.length}
                </span>
              </>
            )}
          </button>

          {/* Create Card */}
          <button
            onClick={() => {
              onTabChange('create');
              onCreateCard();
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
              activeTab === 'create'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Create Card</span>}
          </button>

          {/* Analytics */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
              activeTab === 'analytics'
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Analytics</span>}
          </button>
        </nav>

        {/* Content Area */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            {activeTab === 'cards' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">Recent Cards</h3>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : cards.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {card.title || 'Untitled Card'}
                            </h4>
                            {card.company && (
                              <p className="text-xs text-gray-500 truncate">
                                {card.company}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                card.is_published
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {card.is_published ? 'Live' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{formatDate(card.updated_at)}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {card.view_count || 0}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditCard(card.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          {card.is_published && card.slug && (
                            <button
                              onClick={() => handleViewCard(card.slug)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              <Globe className="w-3 h-3" />
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No cards yet</p>
                    <button
                      onClick={onCreateCard}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Create your first card
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-3">Analytics</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Total Views</p>
                        <p className="text-lg font-bold text-blue-900">{analytics.totalViews}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-600 font-medium">Published Cards</p>
                        <p className="text-lg font-bold text-green-900">{analytics.publishedCards}</p>
                      </div>
                      <Globe className="w-6 h-6 text-green-600" />
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-600 font-medium">Total Cards</p>
                        <p className="text-lg font-bold text-purple-900">{analytics.totalCards}</p>
                      </div>
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>

                  {analytics.totalCards > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-2">Engagement Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min((analytics.publishedCards / analytics.totalCards) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-700 font-medium">
                          {Math.round((analytics.publishedCards / analytics.totalCards) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col ${
          isCollapsed ? 'w-16' : 'w-80'
        } transition-all duration-300 ${className}`}
      >
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-80 max-w-sm">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};