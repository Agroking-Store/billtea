import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function DashboardTheme({ colors }: any) {

  return (
    <>
      
               {/* Theme Colors */}
      
      {/* Theme Header */}
      
      <View style={styles.themeHeader}>
      
        <Text style={[styles.sectionTitle,{color:colors.text}]}>
          Brand Colors
        </Text>
      
        <Pressable
          style={[
            styles.savePaletteButton,
            {
              backgroundColor:colors.primary,
            },
          ]}
        >
          <Text style={styles.savePaletteText}>
            Save Theme Palette
          </Text>
        </Pressable>
      
      </View>
      
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor:colors.glassBackground,
            borderColor:colors.glassBorder,
          },
        ]}
      >
      
        {[
          {
            title:"Primary",
            desc:"Main brand color",
            color:"#3B82F6",
          },
          {
            title:"On Primary",
            desc:"Text on primary",
            color:"#FFFFFF",
          },
          {
            title:"Secondary",
            desc:"Secondary brand color",
            color:"#8B5CF6",
          },
          {
            title:"On Secondary",
            desc:"Text on secondary",
            color:"#FFFFFF",
          },
          {
            title:"Tertiary",
            desc:"Accent color",
            color:"#10B981",
          },
          {
            title:"On Tertiary",
            desc:"Text on tertiary",
            color:"#FFFFFF",
          },
        ].map((item,index)=>(
          <View
            key={index}
            style={[
              styles.colorRow,
              index===5 && {borderBottomWidth:0},
            ]}
          >
      
            <View style={styles.colorInfo}>
      
              <Text
                style={[
                  styles.colorName,
                  {color:colors.text},
                ]}
              >
                {item.title}
              </Text>
      
              <Text
                style={[
                  styles.colorDescription,
                  {color:colors.textSecondary},
                ]}
              >
                {item.desc}
              </Text>
      
            </View>
      
            <View style={styles.colorRight}>
      
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor:item.color,
                  },
                ]}
              />
      
              <View
                style={[
                  styles.hexBox,
                  {
                    borderColor:colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hexText,
                    {color:colors.text},
                  ]}
                >
                  {item.color}
                </Text>
              </View>
      
            </View>
      
          </View>
        ))}
         
      </View>
        
        {/* Primary Variations */}
      {/* Primary Variations */}
      
      <View style={styles.themeHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Primary Variations
        </Text>
      </View>
      
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.glassBackground,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {[
          {
            title: 'Primary Container',
            desc: 'A softer background fill for primary-colored elements',
            token: '--PRIMARY-CONTAINER',
            color: '#0e4d6e',
          },
          {
            title: 'On Primary Container',
            desc: 'Text color used inside a primary container',
            token: '--ON-PRIMARY-CONTAINER',
            color: '#c8eaff',
          },
          {
            title: 'Primary Fixed',
            desc: 'A fixed primary color that ignores dark mode inversions',
            token: '--PRIMARY-FIXED',
            color: '#c8eaff',
          },
          {
            title: 'Primary Fixed Dim',
            desc: 'A slightly darker variation of the fixed primary color',
            token: '--PRIMARY-FIXED-DIM',
            color: '#7dd3fc',
          },
          {
            title: 'Inverse Primary',
            desc: 'Primary color used on inverted backgrounds (e.g. snackbars)',
            token: '--INVERSE-PRIMARY',
            color: '#0a4c6e',
          },
        ].map((item, index) => (
          <View
            key={index}
            style={[
              styles.colorRow,
              index === 4 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.colorInfo}>
              <Text
                style={[
                  styles.colorName,
                  { color: colors.text },
                ]}
              >
                {item.title}
              </Text>
      
              <Text
                style={[
                  styles.colorDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {item.desc}
              </Text>
      
              <Text
                style={[
                  styles.colorKey,
                  { color: colors.textSecondary },
                ]}
              >
                {item.token}
              </Text>
            </View>
      
            <View style={styles.colorRight}>
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />
      
              <View
                style={[
                  styles.hexBox,
                  {
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hexText,
                    { color: colors.text },
                  ]}
                >
                  {item.color}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Secondary / Tertiary Variations */}
      
      <View style={styles.themeHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Secondary/Tertiary Variations
        </Text>
      </View>
      
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.glassBackground,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {[
          {
            title: 'Secondary Container',
            desc: 'A softer background fill for secondary-colored elements',
            token: '--SECONDARY-CONTAINER',
            color: '#1a3a4e',
          },
          {
            title: 'On Secondary Container',
            desc: 'Text color used inside a secondary container',
            token: '--ON-SECONDARY-CONTAINER',
            color: '#c0d8e8',
          },
          {
            title: 'Tertiary Container',
            desc: 'A softer background fill for tertiary-colored elements',
            token: '--TERTIARY-CONTAINER',
            color: '#3d2060',
          },
          {
            title: 'On Tertiary Container',
            desc: 'Text color used inside a tertiary container',
            token: '--ON-TERTIARY-CONTAINER',
            color: '#e8d0ff',
          },
        ].map((item, index) => (
          <View
            key={index}
            style={[
              styles.colorRow,
              index === 3 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.colorInfo}>
              <Text
                style={[
                  styles.colorName,
                  { color: colors.text },
                ]}
              >
                {item.title}
              </Text>
      
              <Text
                style={[
                  styles.colorDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {item.desc}
              </Text>
      
              <Text
                style={[
                  styles.colorKey,
                  { color: colors.textSecondary },
                ]}
              >
                {item.token}
              </Text>
            </View>
      
            <View style={styles.colorRight}>
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />
      
              <View
                style={[
                  styles.hexBox,
                  {
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hexText,
                    { color: colors.text },
                  ]}
                >
                  {item.color}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Backgrounds & Surfaces */}
      
      <View style={styles.themeHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Backgrounds & Surfaces
        </Text>
      </View>
      
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.glassBackground,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {[
          {
            title: 'Background',
            desc: 'The default background color for the main app canvas',
            token: '--BACKGROUND',
            color: '#0a0e1a',
          },
          {
            title: 'On Background',
            desc: 'Text color used directly on the main background',
            token: '--ON-BACKGROUND',
            color: '#e0e8f0',
          },
          {
            title: 'Surface',
            desc: 'Background color for cards, sheets, and menus',
            token: '--SURFACE',
            color: '#0f1524',
          },
          {
            title: 'Surface Dim',
            desc: 'A slightly darker surface color for subtle contrast',
            token: '--SURFACE-DIM',
            color: '#0f1524',
          },
          {
            title: 'Surface Bright',
            desc: 'A slightly lighter surface color for elevated contrast',
            token: '--SURFACE-BRIGHT',
            color: '#1a2438',
          },
          {
            title: 'Surface Tint',
            desc: 'A tint applied to surfaces to indicate elevation',
            token: '--SURFACE-TINT',
            color: '#7dd3fc',
          },
          {
            title: 'Surface Variant',
            desc: 'An alternative surface color for distinct UI sections',
            token: '--SURFACE-VARIANT',
            color: '#1a2438',
          },
        ].map((item, index) => (
          <View
            key={index}
            style={[
              styles.colorRow,
              index === 6 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.colorInfo}>
              <Text
                style={[
                  styles.colorName,
                  { color: colors.text },
                ]}
              >
                {item.title}
              </Text>
      
              <Text
                style={[
                  styles.colorDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {item.desc}
              </Text>
      
              <Text
                style={[
                  styles.colorKey,
                  { color: colors.textSecondary },
                ]}
              >
                {item.token}
              </Text>
            </View>
      
            <View style={styles.colorRight}>
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />
      
              <View
                style={[
                  styles.hexBox,
                  {
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hexText,
                    { color: colors.text },
                  ]}
                >
                  {item.color}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Surface Containers */}
      
      <View style={styles.themeHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Surface Containers
        </Text>
      </View>
      
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.glassBackground,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {[
          {
            title: 'Lowest Container',
            desc: 'The lightest possible container background (lowest elevation)',
            token: '--SURFACE-CONTAINER-LOWEST',
            color: '#0a0e1a',
          },
          {
            title: 'Low Container',
            desc: 'A subtle container background, often used for flat lists',
            token: '--SURFACE-CONTAINER-LOW',
            color: '#111828',
          },
          {
            title: 'Container',
            desc: 'The standard container background for general grouping',
            token: '--SURFACE-CONTAINER',
            color: '#141c2e',
          },
          {
            title: 'High Container',
            desc: 'A slightly emphasized container background',
            token: '--SURFACE-CONTAINER-HIGH',
            color: '#1a2438',
          },
          {
            title: 'Highest Container',
            desc: 'The most emphasized container background (e.g. distinct inputs)',
            token: '--SURFACE-CONTAINER-HIGHEST',
            color: '#202c42',
          },
        ].map((item, index) => (
          <View
            key={index}
            style={[
              styles.colorRow,
              index === 4 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.colorInfo}>
              <Text
                style={[
                  styles.colorName,
                  { color: colors.text },
                ]}
              >
                {item.title}
              </Text>
      
              <Text
                style={[
                  styles.colorDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {item.desc}
              </Text>
      
              <Text
                style={[
                  styles.colorKey,
                  { color: colors.textSecondary },
                ]}
              >
                {item.token}
              </Text>
            </View>
      
            <View style={styles.colorRight}>
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />
      
              <View
                style={[
                  styles.hexBox,
                  {
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hexText,
                    { color: colors.text },
                  ]}
                >
                  {item.color}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Text & Outlines */}
      
      <View style={styles.themeHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Text & Outlines
        </Text>
      </View>
      
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.glassBackground,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {[
          {
            title: 'On Surface',
            desc: 'Primary text color used on top of most surface elements',
            token: '--ON-SURFACE',
            color: '#e0e8f0',
          },
          {
            title: 'On Surface Variant',
            desc: 'Secondary or muted text color on surface elements',
            token: '--ON-SURFACE-VARIANT',
            color: '#a0b4c4',
          },
          {
            title: 'Outline',
            desc: 'Standard border and divider color',
            token: '--OUTLINE',
            color: '#4a6070',
          },
          {
            title: 'Outline Variant',
            desc: 'Lighter or more subtle border color for decorative dividers',
            token: '--OUTLINE-VARIANT',
            color: '#2a3a48',
          },
        ].map((item, index) => (
          <View
            key={index}
            style={[
              styles.colorRow,
              index === 3 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.colorInfo}>
              <Text
                style={[
                  styles.colorName,
                  { color: colors.text },
                ]}
              >
                {item.title}
              </Text>
      
              <Text
                style={[
                  styles.colorDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {item.desc}
              </Text>
      
              <Text
                style={[
                  styles.colorKey,
                  { color: colors.textSecondary },
                ]}
              >
                {item.token}
              </Text>
            </View>
      
            <View style={styles.colorRight}>
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />
      
              <View
                style={[
                  styles.hexBox,
                  {
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hexText,
                    { color: colors.text },
                  ]}
                >
                  {item.color}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Feedback (Errors) */}
      
      <View style={styles.themeHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Feedback (Errors)
        </Text>
      </View>
      
      <View
        style={[
          styles.themeCard,
          {
            backgroundColor: colors.glassBackground,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {[
          {
            title: 'Error',
            desc: 'Main color used to indicate destructive actions or invalid states',
            token: '--ERROR',
            color: '#ff6b6b',
          },
          {
            title: 'On Error',
            desc: 'Text color used on top of the error color',
            token: '--ON-ERROR',
            color: '#1a0000',
          },
          {
            title: 'Error Container',
            desc: 'A softer background fill for error messages or alerts',
            token: '--ERROR-CONTAINER',
            color: '#3d1414',
          },
          {
            title: 'On Error Container',
            desc: 'Text color used inside an error container',
            token: '--ON-ERROR-CONTAINER',
            color: '#ffb3b3',
          },
        ].map((item, index) => (
          <View
            key={index}
            style={[
              styles.colorRow,
              index === 3 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.colorInfo}>
              <Text
                style={[
                  styles.colorName,
                  { color: colors.text },
                ]}
              >
                {item.title}
              </Text>
      
              <Text
                style={[
                  styles.colorDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {item.desc}
              </Text>
      
              <Text
                style={[
                  styles.colorKey,
                  { color: colors.textSecondary },
                ]}
              >
                {item.token}
              </Text>
            </View>
      
            <View style={styles.colorRight}>
              <View
                style={[
                  styles.colorBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />
      
              <View
                style={[
                  styles.hexBox,
                  {
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.hexText,
                    { color: colors.text },
                  ]}
                >
                  {item.color}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
       {/* Action Buttons */}

<View style={styles.buttonContainer}>

  <Pressable
    style={[
      styles.actionButton,
      styles.resetButton,
      {
        backgroundColor: '#E84E4E',
      },
    ]}
  >
    <Text style={styles.buttonText}>
      Reset Defaults
    </Text>
  </Pressable>

  <Pressable
    style={[
      styles.actionButton,
      styles.saveButton,
      {
        backgroundColor: '#618DEC',
      },
    ]}
  >
    <Text style={styles.buttonText}>
      Save Dark Theme
    </Text>
  </Pressable>

</View>

{/* Live Preview */}

<Pressable
  style={[
    styles.previewButton,
    {
      backgroundColor: '#618DEC',
    },
  ]}
>
  <Text style={styles.previewButtonText}>
    Live Preview
  </Text>
</Pressable>

    </>

    
  );
}

 const styles = StyleSheet.create({

sectionTitle: {
  fontSize: 20,
  fontWeight: '700',
  marginTop: 0,
  marginBottom: 0,
},

themeHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 16,
  marginBottom: 12,
},

savePaletteButton: {
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 10,
},

savePaletteText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '700',
},

themeCard: {
  borderWidth: 1,
  borderRadius: 16,
  paddingHorizontal: 18,
  paddingVertical: 8,
},

colorRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 18,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255,255,255,0.08)',
},

colorInfo: {
  flex: 1,
  paddingRight: 16,
},

colorName: {
  fontSize: 15,
  fontWeight: '700',
},

colorDescription: {
  fontSize: 12,
  marginTop: 4,
  lineHeight: 18,
},

colorRight: {
  flexDirection: 'row',
  alignItems: 'center',
},

colorBox: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
},

hexBox: {
  marginLeft: 10,
  minWidth: 84,
  height: 34,
  borderWidth: 1,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 12,
},

hexText: {
  fontSize: 12,
  fontWeight: '600',
  letterSpacing: 0.3,
},
colorKey: {
  fontSize: 11,
  marginTop: 6,
  letterSpacing: 2,
  textTransform: 'uppercase',
},

buttonContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 24,
  marginBottom: 20,
},

actionButton: {
  flex: 1,
  height: 52,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
},

resetButton: {
  marginRight: 8,
},

saveButton: {
  marginLeft: 8,
},

buttonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '600',
},

previewButton: {
  marginTop: 12,
  height: 52,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
},

previewButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '700',
},
 });