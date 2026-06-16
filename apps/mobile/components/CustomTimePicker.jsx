import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3; // Must be odd to have a center
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const CustomTimePicker = ({ visible, onClose, onSelect, initialTime }) => {
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);

    const [selectedHour, setSelectedHour] = useState('12');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    const hourListRef = useRef(null);
    const minuteListRef = useRef(null);
    const ampmListRef = useRef(null);

    // Refs to track last haptic index during scroll
    const lastHourIndex = useRef(-1);
    const lastMinuteIndex = useRef(-1);
    const lastPeriodIndex = useRef(-1);

    useEffect(() => {
        if (visible && initialTime) {
            // Parse and scroll to initial time
            const [h, m] = initialTime.split(':');
            let hourInt = parseInt(h, 10);
            const period = hourInt >= 12 ? 'PM' : 'AM';

            if (hourInt > 12) hourInt -= 12;
            if (hourInt === 0) hourInt = 12;

            const hourStr = hourInt.toString();

            setSelectedHour(hourStr);
            setSelectedMinute(m);
            setSelectedPeriod(period);

            // Reset haptic trackers
            lastHourIndex.current = -1;
            lastMinuteIndex.current = -1;
            lastPeriodIndex.current = -1;

            // Wait for layout to be ready to scroll
            setTimeout(() => {
                const hIndex = HOURS.indexOf(hourStr);
                const mIndex = MINUTES.indexOf(m);
                const pIndex = PERIODS.indexOf(period);

                if (hIndex !== -1 && hourListRef.current) {
                    hourListRef.current.scrollToIndex({ index: hIndex, animated: false });
                    lastHourIndex.current = hIndex;
                }
                if (mIndex !== -1 && minuteListRef.current) {
                    minuteListRef.current.scrollToIndex({ index: mIndex, animated: false });
                    lastMinuteIndex.current = mIndex;
                }
                if (pIndex !== -1 && ampmListRef.current) {
                    ampmListRef.current.scrollToIndex({ index: pIndex, animated: false });
                    lastPeriodIndex.current = pIndex;
                }
            }, 100);
        }
    }, [visible, initialTime]);

    const handleConfirm = () => {
        let hour = parseInt(selectedHour, 10);
        if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
        if (selectedPeriod === 'AM' && hour === 12) hour = 0;

        const formattedHour = hour.toString().padStart(2, '0');
        const timeString = `${formattedHour}:${selectedMinute}`;
        onSelect(timeString);
        onClose();
    };

    const handleScroll = (e, lastIndexRef) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);

        if (index !== lastIndexRef.current && index >= 0) {
            lastIndexRef.current = index;
            Haptics.selectionAsync(); // Tic on every item passing center
        }
    };

    const handleScrollEnd = (e, data, setter) => {
        const y = e.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        if (data[index]) {
            setter(data[index]);
        }
    };

    const scrollToItem = (ref, index) => {
        if (ref.current) {
            ref.current.scrollToIndex({ index, animated: true });
        }
    };

    const renderItem = (item, selected, onSelect, data, ref) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => {
                const index = data.indexOf(item);
                if (selected !== item) {
                    onSelect(item);
                    Haptics.selectionAsync(); // Click sound/feel on tap
                    scrollToItem(ref, index);
                }
            }}
        >
            <Text style={[styles.itemText, item === selected && styles.selectedItemText]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    const getItemLayout = (_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    });

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Select Time</Text>

                    <View style={[styles.pickerContainer, { height: CONTAINER_HEIGHT }]}>
                        {/* Selection Overlay (Lens) */}
                        <View style={styles.selectionOverlay} pointerEvents="none" />

                        {/* Hours */}
                        <View style={styles.column}>
                            <FlatList
                                ref={hourListRef}
                                data={HOURS}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => renderItem(item, selectedHour, setSelectedHour, HOURS, hourListRef)}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ITEM_HEIGHT}
                                snapToAlignment="center"
                                decelerationRate={0.9}
                                getItemLayout={getItemLayout}
                                onScroll={(e) => handleScroll(e, lastHourIndex)}
                                scrollEventThrottle={16}
                                onMomentumScrollEnd={(e) => handleScrollEnd(e, HOURS, setSelectedHour)}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                            />
                        </View>

                        {/* Separator */}
                        <Text style={styles.separator}>:</Text>

                        {/* Minutes */}
                        <View style={styles.column}>
                            <FlatList
                                ref={minuteListRef}
                                data={MINUTES}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => renderItem(item, selectedMinute, setSelectedMinute, MINUTES, minuteListRef)}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ITEM_HEIGHT}
                                snapToAlignment="center"
                                decelerationRate={0.9}
                                getItemLayout={getItemLayout}
                                onScroll={(e) => handleScroll(e, lastMinuteIndex)}
                                scrollEventThrottle={16}
                                onMomentumScrollEnd={(e) => handleScrollEnd(e, MINUTES, setSelectedMinute)}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                            />
                        </View>

                        {/* AM/PM */}
                        <View style={styles.column}>
                            <FlatList
                                ref={ampmListRef}
                                data={PERIODS}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => renderItem(item, selectedPeriod, setSelectedPeriod, PERIODS, ampmListRef)}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ITEM_HEIGHT}
                                snapToAlignment="center"
                                decelerationRate={0.9}
                                getItemLayout={getItemLayout}
                                onScroll={(e) => handleScroll(e, lastPeriodIndex)}
                                scrollEventThrottle={16}
                                onMomentumScrollEnd={(e) => handleScrollEnd(e, PERIODS, setSelectedPeriod)}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                            />
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
                            <Text style={styles.confirmText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const makeStyles = (t) => {
    const c = t.colors;
    const r = t.radius;
    const f = t.fonts;
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: c.overlay,
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: c.surface,
            borderTopLeftRadius: r.xl,
            borderTopRightRadius: r.xl,
            padding: 20,
            paddingBottom: 40,
        },
        title: {
            fontSize: 18,
            fontFamily: f.bold,
            textAlign: 'center',
            marginBottom: 20,
            color: c.text,
        },
        pickerContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative', // For absolute overlay
        },
        selectionOverlay: {
            position: 'absolute',
            top: ITEM_HEIGHT, // Center row (index 1 of 3)
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            backgroundColor: c.primarySoft,
            borderRadius: r.sm,
            zIndex: -1, // Behind text
        },
        column: {
            width: 80,
            height: '100%',
        },
        item: {
            height: ITEM_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center',
        },
        itemText: {
            fontSize: 20,
            fontFamily: f.regular,
            color: c.textMuted,
        },
        selectedItemText: {
            fontSize: 24,
            fontFamily: f.bold,
            color: c.primary,
        },
        separator: {
            fontSize: 24,
            fontFamily: f.bold,
            color: c.text,
            marginTop: 0,
            zIndex: 1,
        },
        actions: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
        },
        button: {
            flex: 1,
            padding: 16,
            borderRadius: r.md,
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: c.surfaceAlt,
            marginRight: 8,
        },
        confirmButton: {
            backgroundColor: c.primary,
            marginLeft: 8,
        },
        cancelText: {
            color: c.textSecondary,
            fontFamily: f.bold,
            fontSize: 16,
        },
        confirmText: {
            color: c.textOnPrimary,
            fontFamily: f.bold,
            fontSize: 16,
        },
    });
};

export default CustomTimePicker;
