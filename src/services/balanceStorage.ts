mport AsyncStorage from '@react-native-async-storage/async-storage';

export const saveBalance = async (email: string, balance: number) => {
	await AsyncStorage.setItem(`balance_${email}`, balance.toString());
};

export const loadBalance = async (email: string) => {
	const value = await AsyncStorage.getItem(`balance_${email}`);
	return value ? parseFloat(value) : 0;
};
