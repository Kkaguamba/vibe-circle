import { useState } from 'react';
import {
  SafeAreaView, ScrollView, View, Text, Pressable, StyleSheet,
  TextInput, useWindowDimensions,
} from 'react-native';

const categories = ['For you', 'Comedy', 'Wisdom', 'Motivation', 'Life'];

const demoPosts = [
  {
    name: 'Alex M.',
    group: 'The Weekend Crew',
    time: '12 min ago',
    category: 'Comedy',
    caption: 'When the group says “one quick drink” and suddenly it is Monday 😂',
    reactions: '😂 18   ❤️ 6',
    comments: '7 comments',
    kind: 'LINK',
  },
  {
    name: 'Nia W.',
    group: 'The Weekend Crew',
    time: '38 min ago',
    category: 'Wisdom',
    caption: 'A reminder worth keeping: progress is still progress, even when it is quiet.',
    reactions: '💡 12   ❤️ 9',
    comments: '4 comments',
    kind: 'QUOTE',
  },
];

export default function HomeScreen() {
  const [active, setActive] = useState('For you');
  const [showComposer, setShowComposer] = useState(false);
  const [caption, setCaption] = useState('');
  const [url, setUrl] = useState('');
  const { width } = useWindowDimensions();
  const wide = width > 760;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.shell, wide && styles.wideShell]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>VibeCircle</Text>
            <Text style={styles.tagline}>Good finds are better shared.</Text>
          </View>
          <Pressable style={styles.avatar}><Text style={styles.avatarText}>K</Text></Pressable>
        </View>

        <View style={styles.groupStrip}>
          <View>
            <Text style={styles.eyebrow}>YOUR CIRCLES</Text>
            <Text style={styles.groupName}>The Weekend Crew</Text>
            <Text style={styles.muted}>12 members · Private</Text>
          </View>
          <Pressable style={styles.invite}><Text style={styles.inviteText}>＋ Invite</Text></Pressable>
        </View>

        <View style={styles.feedHeader}>
          <View>
            <Text style={styles.heading}>The feed</Text>
            <Text style={styles.muted}>A little laughter, a little wisdom.</Text>
          </View>
          <Pressable onPress={() => setShowComposer(!showComposer)} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>＋ Share</Text>
          </Pressable>
        </View>

        {showComposer && (
          <View style={styles.composer}>
            <Text style={styles.cardTitle}>Share something with your circle</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="Paste a reel or video link"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              multiline
              style={[styles.input, styles.captionInput]}
            />
            <Text style={styles.helper}>Direct uploads and publishing will be connected in the next build step.</Text>
            <Pressable style={styles.primaryButton} onPress={() => {
              setCaption('');
              setUrl('');
              setShowComposer(false);
            }}>
              <Text style={styles.primaryButtonText}>Save draft</Text>
            </Pressable>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((category) => (
            <Pressable key={category} onPress={() => setActive(category)}
              style={[styles.pill, active === category && styles.activePill]}>
              <Text style={[styles.pillText, active === category && styles.activePillText]}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.feed}>
          {demoPosts
            .filter((post) => active === 'For you' || post.category === active)
            .map((post, index) => (
              <View key={index} style={styles.post}>
                <View style={styles.postTop}>
                  <View style={styles.smallAvatar}><Text style={styles.smallAvatarText}>{post.name[0]}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.author}>{post.name}</Text>
                    <Text style={styles.muted}>{post.group} · {post.time}</Text>
                  </View>
                  <Text style={styles.categoryTag}>{post.category}</Text>
                </View>
                <Text style={styles.postCaption}>{post.caption}</Text>
                <View style={styles.linkPreview}>
                  <Text style={styles.previewIcon}>{post.kind === 'LINK' ? '▶' : '✦'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewTitle}>{post.kind === 'LINK' ? 'Shared video link' : 'A thought to keep'}</Text>
                    <Text style={styles.muted}>{post.kind === 'LINK' ? 'Open the original video' : 'Wisdom shared with the circle'}</Text>
                  </View>
                  <Text style={styles.muted}>↗</Text>
                </View>
                <View style={styles.postBottom}>
                  <Text style={styles.reactions}>{post.reactions}</Text>
                  <Text style={styles.muted}>{post.comments}</Text>
                </View>
              </View>
            ))}
          <Text style={styles.footerNote}>You're all caught up. Go find something good to share.</Text>
        </ScrollView>

        <View style={styles.bottomNav}>
          <Text style={styles.navActive}>⌂  Home</Text>
          <Text style={styles.navItem}>◉  Discover</Text>
          <Pressable onPress={() => setShowComposer(!showComposer)}><Text style={styles.navItem}>＋  Create</Text></Pressable>
          <Text style={styles.navItem}>♙  Profile</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  shell: { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 18 },
  wideShell: { paddingHorizontal: 28 },
  header: { paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 25, fontWeight: '800', color: '#20223A', letterSpacing: -0.8 },
  tagline: { color: '#777B91', fontSize: 12, marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6E9FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#4C53B8', fontWeight: '800' },
  groupStrip: { backgroundColor: '#25294B', padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#B9BDE2', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  groupName: { color: '#FFFFFF', fontWeight: '700', fontSize: 17, marginTop: 5 },
  muted: { color: '#85899D', fontSize: 11, marginTop: 3 },
  invite: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  inviteText: { color: '#25294B', fontWeight: '700', fontSize: 12 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 23, marginBottom: 14 },
  heading: { color: '#20223A', fontSize: 21, fontWeight: '800' },
  shareButton: { backgroundColor: '#5C63D8', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 11 },
  shareButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  categories: { gap: 8, paddingBottom: 15 },
  pill: { backgroundColor: '#ECEEF5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  activePill: { backgroundColor: '#25294B' },
  pillText: { color: '#666B80', fontWeight: '600', fontSize: 12 },
  activePillText: { color: '#FFFFFF' },
  feed: { gap: 13, paddingBottom: 20 },
  post: { backgroundColor: '#FFFFFF', borderRadius: 17, padding: 16, borderWidth: 1, borderColor: '#ECEEF4' },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FCE7D9', alignItems: 'center', justifyContent: 'center' },
  smallAvatarText: { color: '#A85B2A', fontWeight: '800' },
  author: { color: '#252740', fontWeight: '700', fontSize: 13 },
  categoryTag: { color: '#555CC8', backgroundColor: '#F0F0FF', overflow: 'hidden', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '700' },
  postCaption: { color: '#30334C', fontSize: 15, lineHeight: 22, marginTop: 15, marginBottom: 13 },
  linkPreview: { backgroundColor: '#F5F6FA', borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  previewIcon: { width: 38, height: 38, borderRadius: 11, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#E4E6FF', color: '#565DC8', fontSize: 18, paddingTop: 8 },
  previewTitle: { color: '#30334C', fontWeight: '700', fontSize: 12 },
  postBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F1F5', marginTop: 13, paddingTop: 11 },
  reactions: { color: '#565B75', fontSize: 12, fontWeight: '600' },
  footerNote: { textAlign: 'center', color: '#9296A8', fontSize: 11, paddingVertical: 16 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#E9EAF0', backgroundColor: '#F7F8FC' },
  navActive: { color: '#555CC8', fontWeight: '800', fontSize: 11 },
  navItem: { color: '#85899D', fontWeight: '600', fontSize: 11 },
  composer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EAF2', borderRadius: 16, padding: 15, marginBottom: 14, gap: 10 },
  cardTitle: { color: '#252740', fontWeight: '800', fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#E3E5ED', borderRadius: 10, padding: 12, color: '#252740', fontSize: 13 },
  captionInput: { minHeight: 65, textAlignVertical: 'top' },
  helper: { color: '#85899D', fontSize: 10 },
  primaryButton: { backgroundColor: '#555CC8', padding: 12, alignItems: 'center', borderRadius: 10 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
