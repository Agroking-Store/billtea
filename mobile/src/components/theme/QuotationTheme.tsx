import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';


export default function QuotationTheme({ colors }: any) {

  const backgroundSurface = [
  {
    title: 'Document Background',
    desc: 'Main background of the PDF',
    token: '--QUO-BG',
    color: '#FFFFFF',
  },
  {
    title: 'Header/Footer Surface',
    desc: 'Dark background used in headers, footers, and table headings',
    token: '--QUO-SURFACE',
    color: '#1B1C1D',
  },
  {
    title: 'Table Row Background',
    desc: 'Background color of the items table rows',
    token: '--QUO-SURFACE-ALT',
    color: '#F9F7F5',
  },
];


  return (

    <>

<View
  style={[
    styles.themeCard,
    {
      backgroundColor: colors.glassBackground,
      borderColor: colors.glassBorder,
    },
  ]}
>
  <Text
  style={[
    styles.sectionTitle,
    {
      color: colors.text,
      marginBottom: 18,
    },
  ]}
>
  Backgrounds & Surfaces
</Text>

  {backgroundSurface.map((item, index) => (
    <View
      key={index}
      style={[
        styles.colorRow,
        index === backgroundSurface.length - 1 && {
          borderBottomWidth: 0,
        },
      ]}
    >
      <View style={styles.colorInfo}>
        <Text
          style={[
            styles.colorName,
            {
              color: colors.text,
            },
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.colorDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {item.desc}
        </Text>

        <Text
          style={[
            styles.colorKey,
            {
              color: colors.textSecondary,
            },
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
              {
                color: colors.text,
              },
            ]}
          >
            {item.color}
          </Text>
        </View>
      </View>
    </View>
  ))}
</View>

    
{/* Brand & Accents */}

<View
  style={[
    styles.themeCard,
    {
      backgroundColor: colors.glassBackground,
      borderColor: colors.glassBorder,
    },
  ]}
>
  <Text
    style={[
      styles.sectionTitle,
      {
        color: colors.text,
        marginBottom: 18,
      },
    ]}
  >
    Brand & Accents
  </Text>

  {brandAccents.map((item, index) => (
    <View
      key={index}
      style={[
        styles.colorRow,
        index === brandAccents.length - 1 && {
          borderBottomWidth: 0,
        },
      ]}
    >
      <View style={styles.colorInfo}>
        <Text
          style={[
            styles.colorName,
            {
              color: colors.text,
            },
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.colorDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {item.desc}
        </Text>

        <Text
          style={[
            styles.colorKey,
            {
              color: colors.textSecondary,
            },
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
              {
                color: colors.text,
              },
            ]}
          >
            {item.color}
          </Text>
        </View>
      </View>
    </View>
  ))}
</View>


{/* Typography */}

<View
  style={[
    styles.themeCard,
    {
      backgroundColor: colors.glassBackground,
      borderColor: colors.glassBorder,
    },
  ]}
>
  <Text
    style={[
      styles.sectionTitle,
      {
        color: colors.text,
        marginBottom: 18,
      },
    ]}
  >
    Typography
  </Text>

  {typography.map((item, index) => (
    <View
      key={index}
      style={[
        styles.colorRow,
        index === typography.length - 1 && {
          borderBottomWidth: 0,
        },
      ]}
    >
      <View style={styles.colorInfo}>
        <Text
          style={[
            styles.colorName,
            {
              color: colors.text,
            },
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.colorDescription,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {item.desc}
        </Text>

        <Text
          style={[
            styles.colorKey,
            {
              color: colors.textSecondary,
            },
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
              {
                color: colors.text,
              },
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
      Save Quotation Theme
    </Text>
  </Pressable>

</View>

{/* Live Preview Button */}

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

const brandAccents = [
  {
    title: 'Primary Accent',
    desc: 'Accent color for taglines, bullet points, and highlights',
    token: '--QUO-PRIMARY',
    color: '#9D7E6C',
  },
  {
    title: 'Borders & Dividers',
    desc: 'Color of table borders and section dividers',
    token: '--QUO-BORDER',
    color: '#E2E2E2',
  },
];

const typography = [
  {
    title: 'Main Text',
    desc: 'Primary text color for titles, item names, and important details',
    token: '--QUO-TEXT',
    color: '#1A1C1C',
  },
  {
    title: 'Muted Text',
    desc: 'Secondary text color for descriptions and subtle information',
    token: '--QUO-TEXT-MUTED',
    color: '#74777C',
  },
];



const styles = StyleSheet.create({

sectionTitle: {
  fontSize: 20,
  fontWeight: '700',
  marginBottom: 12,
},
themeCard: {
  borderWidth: 1,
  borderRadius: 16,
  paddingHorizontal: 18,
  paddingVertical: 8,
  overflow: 'hidden',
  marginTop: 10,   // 8-12 best
},
colorRow:{
 flexDirection:'row',
 alignItems:'center',
 justifyContent:'space-between',
 paddingVertical:18,
 borderBottomWidth:1,
 borderBottomColor:'rgba(255,255,255,0.08)',
},


colorInfo:{
 flex:1,
 paddingRight:16,
},


colorName:{
 fontSize:15,
 fontWeight:'700',
},


colorDescription:{
 fontSize:12,
 marginTop:4,
 lineHeight:18,
},


colorKey:{
 fontSize:11,
 marginTop:6,
 letterSpacing:2,
 textTransform:'uppercase',
},


colorRight:{
 flexDirection:'row',
 alignItems:'center',
},


colorBox: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
},

hexBox:{
 marginLeft:10,
 minWidth:84,
 height:34,
 borderWidth:1,
 borderRadius:8,
 justifyContent:'center',
 alignItems:'center',
 paddingHorizontal:12,
},


hexText:{
 fontSize:12,
 fontWeight:'600',
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