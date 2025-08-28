import React from "react";
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const WithdrawScreen: React.FC = () => {
   const paymentMethods = [
    {name: 'BinancePay', time: 'Instant - 30 minutes', fee: '0 %', limits: '10 - 20,000 USD'},
    {name: 'Neteller', time: 'Instant - 1 day', fee: '0 %', limits: '10 - 10,000 USD'},
    {name: 'Skrill', time: 'Instant - 1 day', fee: '0 %', limits: '10 - 12,000 USD'},
    {name: 'SticPay', time: 'Instant - 1 day', fee: '0 %', limits: '10 - 10,000 USD'},
  ];
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Withdrawal</Text>
      <Text style={styles.subHeader}>All payment methods</Text>
  
      {paymentMethods.map((method, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.cardTitle}>{method.name}</Text>
          <Text>Processing time: {method.time}</Text>
          <Text>Fee: {method.fee}</Text>
          <Text>Limits: {method.limits}</Text>
        </View>
      ))}
      
      <Text style={styles.header}>Transfer</Text>
      {/* Add Transfer Methods Here */}
      {/* This section can be expanded for "Verification required" */}
      <Text style={styles.subHeader}>Verification required</Text>
        {/* Add your transfer verification methods here */}
    </ScrollView>
  );
};

export default WithdrawScreen;

const styles = StyleSheet.create({
   container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
     elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
