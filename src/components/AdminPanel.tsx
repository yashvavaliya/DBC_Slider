import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Save, 
  Eye, 
  Settings, 
  Palette, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  MessageCircle,
  LogOut,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { CardPreview } from './CardPreview';
import { ImageUpload } from './ImageUpload';
import { MediaUpload } from './MediaUpload';
import { ReviewsManager } from './ReviewsManager';
import { AnalyticsPage } from './AnalyticsPage';
import type { Database } from '../lib/supabase';
import { generateSocialLink, SOCIAL_PLATFORMS } from '../utils/socialUtils';

type SocialLink = Database['public']['Tables']['social_links']['Row'];
type BusinessCard = Database['public']['Tables']['business_cards']['Row'];

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
}

interface Review {
  id: string;
  review_url: string;
  title: string;
  created_at: string;
}

interface FormData {
  // Basic Information
  title: string;
  username: string;
  globalUsername: string;
  company: string;
  tagline: string;
  profession: string;
  avatar_url: string;

  // Contact Information
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  map_link: string;

  // Theme and Layout
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    name: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

const THEMES = [
  {
    name: 'Ocean Blue',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#047857',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Sunset Orange',
    primary: '#F59E0B',
    secondary: '#D97706',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Royal Purple',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Rose Pink',
    primary: '#EC4899',
    secondary: '#DB2777',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Dark Mode',
    primary: '#60A5FA',
    secondary: '#3B82F6',
    background: '#1F2937',
    text: '#F9FAFB'
  }
];

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cards' | 'create' | 'analytics'>('cards');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  
  // Form data state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    username: '',
    globalUsername: '',
    company: '',
    tagline: '',
    profession: '',
    avatar_url: '',
    phone: '',
    whatsapp: '',
    email: user?.email || '',
    website: '',
    address: '',
    map_link: '',
    theme: THEMES[0],
    shape: 'rectangle',
    layout: {
      style: 'modern',
      alignment: 'center',
      font: 'Inter'
    },
    is_published: false
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

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
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (cardsError) {
        console.error('Error loading cards:', cardsError);
        return;
      }

      setCards(cardsData || []);

      // Load the first card if exists
      if (cardsData && cardsData.length > 0) {
        loadCard(cardsData[0].id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCard = async (cardId: string) => {
    try {
      setCurrentCardId(cardId);
      
      // Load card data
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (cardError) throw cardError;

      // Update form data
      setFormData({
        title: cardData.title || '',
        username: cardData.slug || '',
        globalUsername: '',
        company: cardData.company || '',
        tagline: cardData.bio || '',
        profession: cardData.position || '',
        avatar_url: cardData.avatar_url || '',
        phone: cardData.phone || '',
        whatsapp: cardData.whatsapp || '',
        email: cardData.email || user?.email || '',
        website: cardData.website || '',
        address: cardData.address || '',
        map_link: cardData.map_link || '',
        theme: (cardData.theme as any) || THEMES[0],
        shape: cardData.shape || 'rectangle',
        layout: (cardData.layout as any) || {
          style: 'modern',
          alignment: 'center',
          font: 'Inter'
        },
        is_published: cardData.is_published || false
      });

      // Load social links
      const { data: socialData, error: socialError } = await supabase
        .from('social_links')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (socialError) {
        console.error('Error loading social links:', socialError);
      } else {
        setSocialLinks(socialData || []);
      }

    } catch (error) {
      console.error('Error loading card:', error);
      alert('Failed to load card. Please try again.');
    }
  };

  const handleCreateCard = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('business_cards')
        .insert({
          user_id: user.id,
          title: 'New Card',
          email: user.email,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      // Set the new card as current and switch to create tab
      setCurrentCardId(data.id);
      setActiveTab('create');
      
      // Update form data with new card
      setFormData({
        ...formData,
        title: data.title || '',
        username: data.slug || '',
        email: data.email || user.email || '',
        is_published: data.is_published || false
      });
      
      // Reload cards to update the list
      await loadUserData();
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCard = async () => {
    if (!user || !currentCardId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('business_cards')
        .update({
          title: formData.title,
          company: formData.company,
          position: formData.profession,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          avatar_url: formData.avatar_url,
          bio: formData.tagline,
          whatsapp: formData.whatsapp,
          address: formData.address,
          map_link: formData.map_link,
          theme: formData.theme,
          shape: formData.shape,
          layout: formData.layout,
          is_published: formData.is_published,
          slug: formData.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCardId);

      if (error) throw error;

      alert('Card saved successfully!');
      await loadUserData();
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleTabChange = (tab: 'cards' | 'create' | 'analytics') => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cards':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Cards</h2>
              <button
                onClick={handleCreateCard}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create New Card
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : cards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{card.title || 'Untitled Card'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        card.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {card.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{card.company || 'No company'}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          loadCard(card.id);
                          setActiveTab('create');
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      {card.is_published && card.slug && (
                        <button
                          onClick={() => window.open(`/c/${card.slug}`, '_blank')}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Cards Yet</h3>
                <p className="text-gray-600 mb-6">Create your first digital business card to get started.</p>
                <button
                  onClick={handleCreateCard}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Card
                </button>
              </div>
            )}
          </div>
        );

      case 'create':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentCardId ? 'Edit Card' : 'Create Card'}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCard}
                    disabled={saving || !currentCardId}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Card
                  </button>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your job title"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio/Tagline
                    </label>
                    <textarea
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description about yourself"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your business address"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  Theme & Style
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => setFormData({ ...formData, theme })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.theme.name === theme.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.secondary }}
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  Publish Settings
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Publish Card</p>
                    <p className="text-sm text-gray-600">Make your card visible to others</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:sticky lg:top-8">
              {user && (
                  onEditCard={async (cardId) => {
                    await loadCard(cardId);
                  socialLinks={socialLinks}
                  mediaItems={mediaItems}
                  reviews={reviews}
                />
              )}
            </div>
          </div>
        );

      case 'analytics':
        return <AnalyticsPage />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        onCreateCard={handleCreateCard}
        onEditCard={(cardId) => {
          loadCard(cardId);
          setActiveTab('create');
        }}
        onTabChange={handleTabChange}
        activeTab={activeTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'cards' && 'My Cards'}
                {activeTab === 'create' && (currentCardId ? 'Edit Card' : 'Create Card')}
                {activeTab === 'analytics' && 'Analytics'}
              </h1>
              <p className="text-gray-600">
                {activeTab === 'cards' && 'Manage your digital business cards'}
                {activeTab === 'create' && 'Design and customize your business card'}
                {activeTab === 'analytics' && 'View your card performance and insights'}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};