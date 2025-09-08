import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { CardPreview } from './CardPreview';
import { ImageUpload } from './ImageUpload';
import { MediaUpload } from './MediaUpload';
import { ReviewsManager } from './ReviewsManager';
import { AnalyticsPage } from './AnalyticsPage';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  MapPin, 
  Save, 
  Eye, 
  Edit,
  Trash2,
  Plus,
  Settings,
  BarChart3,
  LogOut,
  CreditCard,
  Palette,
  Link,
  Star,
  Image as ImageIcon,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { Database } from '../lib/supabase';
import { generateSocialLink, SOCIAL_PLATFORMS } from '../utils/socialUtils';

type BusinessCard = Database['public']['Tables']['business_cards']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];

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
  title: string;
  review_url: string;
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

const CARD_SHAPES = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' }
];

const LAYOUT_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'creative', label: 'Creative' }
];

const LAYOUT_ALIGNMENTS = [
  { value: 'center', label: 'Center' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' }
];

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cards' | 'create' | 'analytics'>('cards');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (activeCard) {
      loadCardData(activeCard);
    }
  }, [activeCard]);

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

      if (cardsError) throw cardsError;
      setCards(cardsData || []);

      // Load user profile for global username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('global_username')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
      } else if (profileData) {
        setFormData(prev => ({
          ...prev,
          globalUsername: profileData.global_username || ''
        }));
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCardData = async (cardId: string) => {
    try {
      // Load card data
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (cardError) throw cardError;

      // Update form data with card data
      setFormData({
        title: cardData.title || '',
        username: cardData.slug || '',
        globalUsername: formData.globalUsername,
        company: cardData.company || '',
        tagline: cardData.bio || '',
        profession: cardData.position || '',
        avatar_url: cardData.avatar_url || '',
        phone: cardData.phone || '',
        whatsapp: cardData.whatsapp || '',
        email: cardData.email || '',
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
        .order('display_order', { ascending: true });

      if (socialError) throw socialError;
      setSocialLinks(socialData || []);

    } catch (error) {
      console.error('Error loading card data:', error);
    }
  };

  const handleCreateCard = () => {
    setActiveCard(null);
    setActiveTab('create');
    // Reset form data for new card
    setFormData({
      title: '',
      username: '',
      globalUsername: formData.globalUsername,
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
    setSocialLinks([]);
    setMediaItems([]);
    setReviews([]);
  };

  const handleEditCard = (cardId: string) => {
    setActiveCard(cardId);
    setActiveTab('create');
  };

  const handleSaveCard = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const cardData = {
        user_id: user.id,
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
        slug: formData.username || null
      };

      let savedCard;
      if (activeCard) {
        // Update existing card
        const { data, error } = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', activeCard)
          .select()
          .single();

        if (error) throw error;
        savedCard = data;
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('business_cards')
          .insert([cardData])
          .select()
          .single();

        if (error) throw error;
        savedCard = data;
        setActiveCard(savedCard.id);
      }

      // Reload user data to update cards list
      await loadUserData();
      
      alert('Card saved successfully!');
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      // If we're currently editing this card, go back to cards list
      if (activeCard === cardId) {
        setActiveCard(null);
        setActiveTab('cards');
      }

      // Reload user data
      await loadUserData();
      alert('Card deleted successfully!');
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card. Please try again.');
    }
  };

  const handleCopyUrl = async (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(slug);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        onCreateCard={handleCreateCard}
        onEditCard={handleEditCard}
        className="flex-shrink-0"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'cards' ? 'My Cards' : 
                 activeTab === 'create' ? (activeCard ? 'Edit Card' : 'Create Card') : 
                 'Analytics'}
              </h1>
              <p className="text-gray-600">
                {activeTab === 'cards' ? 'Manage your digital business cards' :
                 activeTab === 'create' ? 'Design and customize your business card' :
                 'View your card performance and insights'}
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'cards' && (
            <div className="max-w-6xl mx-auto">
              {cards.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cards yet</h3>
                  <p className="text-gray-600 mb-6">Create your first digital business card to get started.</p>
                  <button
                    onClick={handleCreateCard}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Card
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card) => (
                    <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {card.title || 'Untitled Card'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {card.company || 'No company'}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            card.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {card.is_published ? 'Published' : 'Draft'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>Updated {new Date(card.updated_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {card.view_count || 0}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCard(card.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          {card.is_published && card.slug && (
                            <button
                              onClick={() => window.open(`/c/${card.slug}`, '_blank')}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {card.slug && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={`${window.location.origin}/c/${card.slug}`}
                                readOnly
                                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                              />
                              <button
                                onClick={() => handleCopyUrl(card.slug!)}
                                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                title="Copy URL"
                              >
                                {copiedUrl === card.slug ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Basic Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
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
                          Username/Slug
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your-username"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Your card will be available at: /c/{formData.username || 'your-username'}
                        </p>
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
                          Position/Title
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

                  {/* Profile Image */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      Profile Image
                    </h3>
                    {user && (
                      <ImageUpload
                        currentImageUrl={formData.avatar_url}
                        onImageChange={(url) => setFormData({ ...formData, avatar_url: url || '' })}
                        userId={user.id}
                      />
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-blue-600" />
                      Theme & Design
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Color Theme
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {THEMES.map((theme) => (
                            <button
                              key={theme.name}
                              onClick={() => setFormData({ ...formData, theme })}
                              className={`p-3 rounded-lg border-2 transition-all ${
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
                              <span className="text-sm font-medium">{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Shape
                          </label>
                          <select
                            value={formData.shape}
                            onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {CARD_SHAPES.map((shape) => (
                              <option key={shape.value} value={shape.value}>
                                {shape.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Layout Style
                          </label>
                          <select
                            value={formData.layout.style}
                            onChange={(e) => setFormData({
                              ...formData,
                              layout: { ...formData.layout, style: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {LAYOUT_STYLES.map((style) => (
                              <option key={style.value} value={style.value}>
                                {style.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Alignment
                          </label>
                          <select
                            value={formData.layout.alignment}
                            onChange={(e) => setFormData({
                              ...formData,
                              layout: { ...formData.layout, alignment: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {LAYOUT_ALIGNMENTS.map((alignment) => (
                              <option key={alignment.value} value={alignment.value}>
                                {alignment.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  {activeCard && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Link className="w-5 h-5 text-blue-600" />
                        Social Links
                      </h3>
                      {/* Social links management would go here */}
                      <p className="text-gray-600">Social links management coming soon...</p>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.is_published}
                          onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Publish card (make it publicly accessible)
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={handleSaveCard}
                      disabled={saving || !formData.title}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {saving ? 'Saving...' : (activeCard ? 'Update Card' : 'Create Card')}
                    </button>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <CardPreview
                      formData={formData}
                      socialLinks={socialLinks}
                      mediaItems={mediaItems}
                      reviews={reviews}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="max-w-6xl mx-auto">
              <AnalyticsPage />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};