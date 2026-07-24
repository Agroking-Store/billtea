import React, { useState } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";

import { AppHeader } from "../../components/ui/AppHeader";
import Header from "../../components/reports/Header";
import SummaryCard from "../../components/reports/SummaryCard";
import RecentReport from "../../components/reports/RecentReport";
import ProfitSummaryCard from "../../components/reports/ProfitSummaryCard";
import ExportButtons from "../../components/reports/ExportButtons";
import ProfitTransactionCard from "../../components/reports/ProfitTransactionCard";
import { profitTransactions } from "../../constants/reportData";
import { useTheme } from "../../hooks/useTheme";
import TransactionHistoryHeader from "../../components/reports/TransactionHistoryHeader";

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();

  const [selected, setSelected] = useState<
    "invoice" | "profit"
  >("invoice");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <AppHeader title="Reports" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header
          selected={selected}
          onChange={setSelected}
        />

        {selected === "invoice" ? (
          <>
            <SummaryCard />
            <RecentReport />
          </>
        ) : (
          <>
            <ProfitSummaryCard />

            <ExportButtons />
            <TransactionHistoryHeader />

            {profitTransactions.map((item) => (
              <ProfitTransactionCard
                key={item.id}
                title={item.title}
                invoice={item.invoice}
                company={item.company}
                category={item.category}
                amount={item.amount}
                date={item.date}
                type={item.type}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
});