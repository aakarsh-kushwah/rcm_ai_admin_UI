import {
  LayoutDashboard, Users, Shield, Video, Youtube, Film,
  Instagram, Mic, MessageSquare, Bell
} from 'lucide-react';

/*
  Yahi ek list Layout (sidebar / mobile menu) aur Dashboard (cards) dono use karte hain.
  Naya feature add karna ho to sirf yaha ek item add karo, dono jagah apne aap aa jayega.

  - desc wala item Dashboard par card banta hai (bina desc ka item sirf menu me rehta hai)
  - color: blue | purple | red | teal | gold | pink | orange | green | cyan

  Subscription Hub wapas chahiye to Crown import karke ye item "Management" me add karo:
  { to: '/subscribers', label: 'Subscriptions', icon: Crown, color: 'gold',
    desc: 'Track active plans, revenue and billing cycles.' }
*/
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
  },
  {
    label: 'Management',
    items: [
      {
        to: '/users', label: 'Users', icon: Users, color: 'blue',
        desc: 'View user profiles, verify identities and manage permissions.'
      },
      {
        to: '/admins', label: 'Admins', icon: Shield, color: 'purple',
        desc: 'Manage administrators, roles and access.'
      }
    ]
  },
  {
    label: 'Content & AI',
    items: [
      {
        to: '/videos', label: 'Videos', icon: Video, color: 'red',
        desc: 'Upload, edit and organize video content.'
      },
      {
        to: '/channels', label: 'Channels', icon: Youtube, color: 'teal',
        desc: 'Add YouTube channels once. New uploads sync automatically.'
      },
      {
        to: '/shorts', label: 'Shorts', icon: Film, color: 'gold',
        desc: 'Manage short-form videos.'
      },
      {
        to: '/instagram', label: 'Instagram Reels', icon: Instagram, color: 'pink',
        desc: 'Manage Instagram Reels content.'
      },
      {
        to: '/voice-training', label: 'Voice AI', icon: Mic, color: 'orange',
        desc: 'Train voice models and configure text-to-speech.'
      },
      {
        to: '/chats', label: 'Chat Logs', icon: MessageSquare, color: 'green',
        desc: 'Review AI and user conversations.'
      }
    ]
  },
  {
    label: 'System',
    items: [
      {
        to: '/sendnotifications', label: 'Push Notifications', icon: Bell, color: 'cyan',
        desc: 'Send notifications to all app users.'
      }
    ]
  }
];