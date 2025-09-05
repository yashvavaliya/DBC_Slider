import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  Edit3,
  Eye,
  Trash2,
  Globe,
  Share2,
  Download,
  Save,
  Camera,
  Palette,
  Layout,
  Link,
  BarChart3,
  Users,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Instagram,
  Linkedin,
  Github,
  Twitter,
  Facebook,
  Youtube,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  QrCode,
  Star,
  Play,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ImageUpload } from './ImageUpload';
import { CardPreview } from './CardPreview';
import { MediaUpload } from './MediaUpload';
import { ReviewsManager } from './ReviewsManager';
import { AdminSidebar } from './AdminSidebar';
import { AnalyticsPage } from './AnalyticsPage';
import type { Database } from '../lib/supabase';
import { generateSocialLink, SOCIAL_PLATFORMS, isPlatformAutoSyncable, generateAutoSyncedLinks } from '../utils/socialUtils';

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
    text: '#1F2937',
  },
  {
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#047857',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Sunset Orange',
    primary: '#F59E0B',
    secondary: '#D97706',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Royal Purple',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Rose Pink',
    primary: '#EC4899',
    secondary: '#DB2777',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  {
    name: 'Dark Mode',
    primary: '#60A5FA',
    secondary: '#3B82F6',
    background: '#1F2937',
    text: '#F9FAFB',
  },
];

const SHAPES = [
  { id: 'rectangle', name: 'Rectangle', icon: '▭' },
  { id: 'rounded', name: 'Rounded', icon: '▢' },
  { id: 'circle', name: 'Circle', icon: '●' },
];

const LAYOUT_STYLES = [
  { id: 'modern', name: 'Modern' },
  { id: 'classic', name: 'Classic' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'creative', name: 'Creative' },
];

const ALIGNMENTS = [
  { id: 'center', name: 'Center' },
  { id: 'left', name: 'Left' },
  { id: 'right', name: 'Right' },
];

const FONTS = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Roboto', name: 'Roboto' },
  { id: 'Open Sans', name: 'Open Sans' },
  { id: 'Poppins', name: 'Poppins' },
  { id: 'Montserrat', name: 'Montserrat' },
];

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cards' | 'create' | 'edit'>('cards');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    contact: false,
    social: false,
    media: false,
    reviews: false,
    design: false,
  });

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
      font: 'Inter',
    },
    is_published: false,
  });

  useEffect(() => {
    if (user) {
      loadUserCards();
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (editingCardId) {
      loadCardData(editingCardId);
    } else {
      resetForm();
    }
  }, [editingCardId]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setFormData(prev => ({
          ...prev,
          title: data.name || '',
          email: data.email || user.email || '',
          globalUsername: data.global_username || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserCards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading cards:', error);
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCardData = async (cardId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load card data
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', user.id)
        .single();

      if (cardError) {
        console.error('Error loading card:', cardError);
        setMessage({ type: 'error', text: 'Failed to load card data' });
        return;
      }

      // Parse theme and layout
      const theme = typeof cardData.theme === 'object' ? cardData.theme : THEMES[0];
      const layout = typeof cardData.layout === 'object' ? cardData.layout : {
        style: 'modern',
        alignment: 'center',
        font: 'Inter',
      };

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
        theme: theme as any,
        shape: cardData.shape || 'rectangle',
        layout: layout as any,
        is_published: cardData.is_published || false,
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
      console.error('Error loading card data:', error);
      setMessage({ type: 'error', text: 'Failed to load card data' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
        font: 'Inter',
      },
      is_published: false,
    });
          {activeTab === 'analytics' && <AnalyticsPage />}
          
    setSocialLinks([]);
    setMediaItems([]);
    setReviews([]);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleThemeChange = (theme: typeof THEMES[0]) => {
    setFormData(prev => ({
      ...prev,
      theme,
    }));
  };

  const handleLayoutChange = (field: keyof FormData['layout'], value: string) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [field]: value,
      },
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      // Validate required fields
      if (!formData.title.trim()) {
        setMessage({ type: 'error', text: 'Name is required' });
        return;
      }

      // Generate username if not provided
      let username = formData.username.trim();
      if (!username) {
        username = generateSlug(formData.title);
      }

      const cardData = {
        user_id: user.id,
        title: formData.title.trim(),
        company: formData.company.trim() || null,
        position: formData.profession.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        website: formData.website.trim() || null,
        avatar_url: formData.avatar_url || null,
        bio: formData.tagline.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        address: formData.address.trim() || null,
        map_link: formData.map_link.trim() || null,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published,
        slug: username,
      };

      let cardId: string;

      if (editingCardId) {
        // Update existing card
        const { error } = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', editingCardId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating card:', error);
          setMessage({ type: 'error', text: 'Failed to update card' });
          return;
        }

        cardId = editingCardId;
        setMessage({ type: 'success', text: 'Card updated successfully!' });
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('business_cards')
          .insert(cardData)
          .select()
          .single();

        if (error) {
          console.error('Error creating card:', error);
          setMessage({ type: 'error', text: 'Failed to create card' });
          return;
        }

        cardId = data.id;
        setEditingCardId(cardId);
        setMessage({ type: 'success', text: 'Card created successfully!' });
      }

      // Update global username in profile if changed
      if (formData.globalUsername !== '') {
        await supabase
          .from('profiles')
          .update({ 
            global_username: formData.globalUsername.trim() || null,
            name: formData.title.trim()
          })
          .eq('id', user.id);
      }

      // Reload cards
      await loadUserCards();

    } catch (error) {
      console.error('Error saving card:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
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
        .eq('id', cardId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting card:', error);
        setMessage({ type: 'error', text: 'Failed to delete card' });
        return;
      }

      setMessage({ type: 'success', text: 'Card deleted successfully' });
      await loadUserCards();

      if (editingCardId === cardId) {
        setEditingCardId(null);
        setActiveTab('cards');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      setMessage({ type: 'error', text: 'Failed to delete card' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const copyCardLink = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setMessage({ type: 'success', text: 'Card link copied to clipboard!' });
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addSocialLink = () => {
    const newLink: Partial<SocialLink> = {
      id: `temp-${Date.now()}`,
      platform: 'Instagram',
      username: '',
      url: '',
      display_order: socialLinks.length,
      is_active: true,
    };
    setSocialLinks([...socialLinks, newLink as SocialLink]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updatedLinks = [...socialLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };

    // Auto-generate URL for supported platforms
    if (field === 'username' || field === 'platform') {
      const link = updatedLinks[index];
      if (link.platform && link.username) {
        link.url = generateSocialLink(link.platform, link.username);
      }
    }

    setSocialLinks(updatedLinks);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const saveSocialLinks = async () => {
    if (!editingCardId) return;

    try {
      // Delete existing links
      await supabase
        .from('social_links')
        .delete()
        .eq('card_id', editingCardId);

      // Insert new links
      const linksToInsert = socialLinks
        .filter(link => link.platform && link.url)
        .map((link, index) => ({
          card_id: editingCardId,
          platform: link.platform,
          username: link.username || null,
          url: link.url,
          display_order: index,
          is_active: true,
        }));

      if (linksToInsert.length > 0) {
        const { error } = await supabase
          .from('social_links')
          .insert(linksToInsert);

        if (error) {
          console.error('Error saving social links:', error);
          setMessage({ type: 'error', text: 'Failed to save social links' });
          return;
        }
      }

      setMessage({ type: 'success', text: 'Social links saved successfully!' });
    } catch (error) {
      console.error('Error saving social links:', error);
      setMessage({ type: 'error', text: 'Failed to save social links' });
    }
  };

  const handleAutoSyncSocials = async () => {
    if (!formData.globalUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter a global username first' });
      return;
    }

    const autoSyncedLinks = generateAutoSyncedLinks(formData.globalUsername);
    
    // Convert to the format expected by our component
    const newSocialLinks: SocialLink[] = autoSyncedLinks.map((link, index) => ({
      id: `auto-${Date.now()}-${index}`,
      card_id: editingCardId || '',
      platform: link.platform,
      username: link.username,
      url: link.url,
      display_order: socialLinks.length + index,
      is_active: true,
      is_auto_synced: link.is_auto_synced,
      created_at: new Date().toISOString(),
    }));

    setSocialLinks([...socialLinks, ...newSocialLinks]);
    setMessage({ type: 'success', text: `Added ${newSocialLinks.length} social links!` });
  };

  const handleCreateCard = () => {
    setEditingCardId(null);
    setActiveTab('create');
    resetForm();
  };

  const handleEditCard = (cardId: string) => {
    setEditingCardId(cardId);
    setActiveTab('edit');
  };

  if (loading && activeTab === 'cards') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cards...</p>
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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:ml-0 ml-0">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 lg:ml-0 ml-12">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === 'cards' ? 'My Cards' : 
                   activeTab === 'create' ? 'Create New Card' : 'Edit Card'}
                </h1>
                <p className="text-gray-600">
                  {activeTab === 'cards' ? 'Manage your digital business cards' :
                   activeTab === 'create' ? 'Create a new digital business card' : 'Edit your business card'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div className={`mx-4 lg:mx-8 mt-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}fhrthtrh
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          {activeTab === 'cards' && (
            <div className="space-y-6">
              {/* Cards Grid */}
              {cards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card) => (
                    <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {card.title || 'Untitled Card'}
                            </h3>
                            {card.company && (
                              <p className="text-sm text-gray-600">{card.company}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              card.is_published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {card.is_published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>Updated {new Date(card.updated_at).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {card.view_count || 0} rererg
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCard(card.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          {card.is_published && card.slug && (
                            <button
                              onClick={() => window.open(`/c/${card.slug}`, '_blank')}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Globe className="w-4 h-4" />
                              View
                            </button>
                          )}
                          <button
                            onClick={() => copyCardLink(card.slug)}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )}
            </div>
          )}

          {(activeTab === 'create' || activeTab === 'edit') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleSection('basic')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    </div>
                    {expandedSections.basic ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.basic && (
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => handleInputChange('title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Your full name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Username/Slug
                            </label>
                            <div className="flex">
                              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                                /c/
                              </span>
                              <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="your-name"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              This will be your card's URL. Leave empty to auto-generate.
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Global Username
                            </label>
                            <input
                              type="text"
                              value={formData.globalUsername}
                              onChange={(e) => handleInputChange('globalUsername', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="your_username"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Use the same username across all social platforms for auto-sync.
                            </p>
                          </div>
                        </div>

                        <ImageUpload
                          currentImageUrl={formData.avatar_url}
                          onImageChange={(url) => handleInputChange('avatar_url', url || '')}
                          userId={user?.id || ''}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                          </label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your company"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={formData.profession}
                            onChange={(e) => handleInputChange('profession', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your job title"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bio/Tagline
                        </label>
                        <textarea
                          value={formData.tagline}
                          onChange={(e) => handleInputChange('tagline', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="A brief description about yourself"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleSection('contact')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Contact Information</h3>
                    </div>
                    {expandedSections.contact ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.contact && (
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your@email.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            WhatsApp
                          </label>
                          <input
                            type="tel"
                            value={formData.whatsapp}
                            onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+1234567890"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website
                          </label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your business address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Map Link
                        </label>
                        <input
                          type="url"
                          value={formData.map_link}
                          onChange={(e) => handleInputChange('map_link', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://maps.google.com/..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Link to Google Maps or other map service
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleSection('social')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Link className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Social Links</h3>
                    </div>
                    {expandedSections.social ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.social && (
                    <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                      {formData.globalUsername && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-900">Auto-Sync Social Links</h4>
                              <p className="text-sm text-blue-700">
                                Automatically add social links using your global username: <strong>{formData.globalUsername}</strong>
                              </p>
                            </div>
                            <button
                              onClick={handleAutoSyncSocials}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Auto-Sync
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {socialLinks.map((link, index) => (
                          <div key={link.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                            <select
                              value={link.platform}
                              onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {Object.keys(SOCIAL_PLATFORMS).map((platform) => (
                                <option key={platform} value={platform}>
                                  {platform}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              value={link.username || ''}
                              onChange={(e) => updateSocialLink(index, 'username', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={SOCIAL_PLATFORMS[link.platform]?.placeholder || 'username'}
                            />

                            <button
                              onClick={() => removeSocialLink(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={addSocialLink}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Social Link
                        </button>

                        {socialLinks.length > 0 && editingCardId && (
                          <button
                            onClick={saveSocialLinks}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            Save Links
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Gallery */}
                {editingCardId && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleSection('media')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold text-gray-900">Media Gallery</h3>
                      </div>
                      {expandedSections.media ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.media && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <MediaUpload
                          cardId={editingCardId}
                          mediaItems={mediaItems}
                          onMediaChange={setMediaItems}
                          userId={user?.id || ''}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews */}
                {editingCardId && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleSection('reviews')}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-semibold text-gray-900">Reviews</h3>
                      </div>
                      {expandedSections.reviews ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.reviews && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <ReviewsManager
                          cardId={editingCardId}
                          reviews={reviews}
                          onReviewsChange={setReviews}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Design & Layout */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleSection('design')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-pink-600" />
                      <h3 className="font-semibold text-gray-900">Design & Layout</h3>
                    </div>
                    {expandedSections.design ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSections.design && (
                    <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
                      {/* Theme Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Color Theme
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {THEMES.map((theme) => (
                            <button
                              key={theme.name}
                              onClick={() => handleThemeChange(theme)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                formData.theme.name === theme.name
                                  ? 'border-blue-500 ring-2 ring-blue-200'
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
                              <span className="text-sm font-medium text-gray-900">
                                {theme.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shape Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Card Shape
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {SHAPES.map((shape) => (
                            <button
                              key={shape.id}
                              onClick={() => handleInputChange('shape', shape.id)}
                              className={`p-3 rounded-lg border-2 transition-all text-center ${
                                formData.shape === shape.id
                                  ? 'border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{shape.icon}</div>
                              <span className="text-sm font-medium text-gray-900">
                                {shape.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Layout Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Style
                          </label>
                          <select
                            value={formData.layout.style}
                            onChange={(e) => handleLayoutChange('style', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {LAYOUT_STYLES.map((style) => (
                              <option key={style.id} value={style.id}>
                                {style.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alignment
                          </label>
                          <select
                            value={formData.layout.alignment}
                            onChange={(e) => handleLayoutChange('alignment', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {ALIGNMENTS.map((alignment) => (
                              <option key={alignment.id} value={alignment.id}>
                                {alignment.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Font
                          </label>
                          <select
                            value={formData.layout.font}
                            onChange={(e) => handleLayoutChange('font', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {FONTS.map((font) => (
                              <option key={font.id} value={font.id}>
                                {font.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => handleInputChange('is_published', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Publish card (make it publicly accessible)
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {saving ? 'Saving...' : editingCardId ? 'Update Card' : 'Create Card'}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="lg:sticky lg:top-8">
                <CardPreview
                  formData={formData}
                  socialLinks={socialLinks}
                  mediaItems={mediaItems}
                  reviews={reviews}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};