'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Beaker, Droplets, Weight, FlaskConical } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function BasicFormulaCalculator() {
  const [desiredDose, setDesiredDose] = useState('');
  const [doseOnHand, setDoseOnHand] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('tablet(s)');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const d = parseFloat(desiredDose);
    const h = parseFloat(doseOnHand);
    const q = parseFloat(quantity);

    if (d > 0 && h > 0 && q > 0) {
      const amount = (d / h) * q;
      setResult(amount);
    } else {
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-normal">Basic Formula (Desired/Have)</CardTitle>
        <CardDescription>
          Calculate the amount to administer for tablets or liquids.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="desired">Desired Dose (D)</Label>
          <Input type="number" id="desired" placeholder="e.g., 750" value={desiredDose} onChange={(e) => setDesiredDose(e.target.value)} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="have">Dose on Hand (H)</Label>
          <Input type="number" id="have" placeholder="e.g., 250" value={doseOnHand} onChange={(e) => setDoseOnHand(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className='col-span-2'>
            <Label htmlFor="quantity">Quantity (Q)</Label>
            <Input type="number" id="quantity" placeholder="e.g., 1 for tablets, 5 for 5mL" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
           <div>
            <Label>Unit</Label>
             <Select onValueChange={setQuantityUnit} value={quantityUnit}>
                <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="tablet(s)">tablet(s)</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="capsule(s)">capsule(s)</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button onClick={calculate}>Calculate Amount</Button>
        {result !== null && (
          <Alert>
            <Beaker className="h-4 w-4" />
            <AlertTitle className="font-headline">Result</AlertTitle>
            <AlertDescription>
              Administer <strong>{result.toFixed(3)} {quantityUnit}</strong>.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}

function WeightBasedCalculator() {
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [prescribedDose, setPrescribedDose] = useState(''); // mg/kg
  const [doseOnHand, setDoseOnHand] = useState(''); // mg
  const [quantity, setQuantity] = useState(''); // mL
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const weightNum = parseFloat(weight);
    const prescribedDoseNum = parseFloat(prescribedDose);
    const doseOnHandNum = parseFloat(doseOnHand);
    const quantityNum = parseFloat(quantity);

    if (weightNum > 0 && prescribedDoseNum > 0 && doseOnHandNum > 0 && quantityNum > 0) {
      // 1. Convert weight to kg if needed
      const weightInKg = weightUnit === 'lbs' ? weightNum / 2.2 : weightNum;
      
      // 2. Calculate total desired dose
      const totalDesiredDose = weightInKg * prescribedDoseNum;

      // 3. Use basic formula to get the volume
      const volume = (totalDesiredDose / doseOnHandNum) * quantityNum;
      setResult(volume);
    } else {
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-normal">Weight-Based Dosage (Single Dose)</CardTitle>
        <CardDescription>
          Calculate single doses based on patient weight (e.g., mg/kg).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
            <div className='col-span-2'>
                <Label htmlFor="weight">Patient Weight</Label>
                <Input type="number" id="weight" placeholder="e.g., 65" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
                <Label>Unit</Label>
                <Select onValueChange={setWeightUnit} value={weightUnit}>
                    <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="prescribedDose">Prescribed Dose (e.g., mg/kg)</Label>
          <Input type="number" id="prescribedDose" placeholder="e.g., 4" value={prescribedDose} onChange={(e) => setPrescribedDose(e.target.value)} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="doseOnHandW">Dose on Hand (e.g., in mg)</Label>
          <Input type="number" id="doseOnHandW" placeholder="e.g., 500" value={doseOnHand} onChange={(e) => setDoseOnHand(e.target.value)} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="quantityW">Supplied Quantity (e.g., in mL)</Label>
          <Input type="number" id="quantityW" placeholder="e.g., 4" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      </CardContent>
       <CardFooter className="flex flex-col items-start gap-4">
        <Button onClick={calculate}>Calculate Volume</Button>
        {result !== null && (
          <Alert>
            <Weight className="h-4 w-4" />
            <AlertTitle className="font-headline">Result</AlertTitle>
            <AlertDescription>
              Administer <strong>{result.toFixed(3)} mL</strong>.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}


function DripRateCalculator() {
  const [volume, setVolume] = useState('');
  const [time, setTime] = useState('');
  const [dropFactor, setDropFactor] = useState('15');
  const [result, setResult] = useState<number | null>(null);

  const calculateDripRate = () => {
    const volNum = parseFloat(volume);
    const timeNum = parseFloat(time);
    const dropFactorNum = parseInt(dropFactor, 10);

    if (volNum > 0 && timeNum > 0 && dropFactorNum > 0) {
      const dripRate = (volNum * dropFactorNum) / timeNum;
      setResult(dripRate);
    } else {
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-normal">IV Drip Rate (gtts/min)</CardTitle>
        <CardDescription>
          Calculate the flow rate for gravity infusions in drops per minute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="volume">Total Volume to Infuse (mL)</Label>
          <Input type="number" id="volume" placeholder="e.g., 1000" value={volume} onChange={(e) => setVolume(e.target.value)} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="time">Time (in minutes)</Label>
          <Input type="number" id="time" placeholder="e.g., 480" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
         <div className="grid w-full items-center gap-2">
            <Label>Drop Factor (gtts/mL)</Label>
             <RadioGroup defaultValue="15" value={dropFactor} onValueChange={setDropFactor} className="flex flex-col gap-2">
                <div>
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Macro Drip</h4>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="10" id="df-10" />
                            <Label htmlFor="df-10">10 gtts/mL</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="15" id="df-15" />
                            <Label htmlFor="df-15">15 gtts/mL</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="20" id="df-20" />
                            <Label htmlFor="df-20">20 gtts/mL</Label>
                        </div>
                    </div>
                </div>
                 <div>
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">Micro Drip</h4>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="60" id="df-60" />
                        <Label htmlFor="df-60">60 gtts/mL</Label>
                    </div>
                </div>
            </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button onClick={calculateDripRate}>Calculate Drip Rate</Button>
        {result !== null && (
          <Alert>
            <Droplets className="h-4 w-4" />
            <AlertTitle className="font-headline">Result</AlertTitle>
            <AlertDescription>
              Set flow rate to <strong>{Math.round(result)} gtts/min</strong>.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  )
}

function WeightBasedIVRateCalculator() {
  const [desiredDose, setDesiredDose] = useState(''); // mcg/kg/min
  const [weight, setWeight] = useState(''); // kg
  const [totalVolume, setTotalVolume] = useState(''); // mL
  const [totalDrugAmount, setTotalDrugAmount] = useState(''); // mg
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const desiredDoseNum = parseFloat(desiredDose);
    const weightNum = parseFloat(weight);
    const totalVolumeNum = parseFloat(totalVolume);
    const totalDrugAmountNum = parseFloat(totalDrugAmount);

    if (desiredDoseNum > 0 && weightNum > 0 && totalVolumeNum > 0 && totalDrugAmountNum > 0) {
      // 1. Convert total drug amount from mg to mcg
      const totalDrugAmountMcg = totalDrugAmountNum * 1000;
      
      // 2. Calculate mL/hr
      // Formula: (Desired Dose (mcg/kg/min) * Weight (kg) * 60 min/hr) / (Total Drug (mcg) / Total Volume (mL))
      const concentrationMcgPerMl = totalDrugAmountMcg / totalVolumeNum;
      const mlPerHour = (desiredDoseNum * weightNum * 60) / concentrationMcgPerMl;
      
      setResult(mlPerHour);
    } else {
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline font-normal">Weight-Based IV Rate (mcg/kg/min)</CardTitle>
        <CardDescription>
          Calculate the infusion rate in mL/hr for weight-based continuous IV medications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wb-iv-desired-dose">Desired Dose (mcg/kg/min)</Label>
          <Input type="number" id="wb-iv-desired-dose" placeholder="e.g., 5" value={desiredDose} onChange={(e) => setDesiredDose(e.target.value)} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wb-iv-weight">Patient Weight (kg)</Label>
          <Input type="number" id="wb-iv-weight" placeholder="e.g., 63" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wb-iv-total-volume">Total Volume in IV Bag (mL)</Label>
          <Input type="number" id="wb-iv-total-volume" placeholder="e.g., 250" value={totalVolume} onChange={(e) => setTotalVolume(e.target.value)} />
        </div>
         <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wb-iv-total-drug">Total Drug in IV Bag (mg)</Label>
          <Input type="number" id="wb-iv-total-drug" placeholder="e.g., 400" value={totalDrugAmount} onChange={(e) => setTotalDrugAmount(e.target.value)} />
        </div>
      </CardContent>
       <CardFooter className="flex flex-col items-start gap-4">
        <Button onClick={calculate}>Calculate IV Rate (mL/hr)</Button>
        {result !== null && (
          <Alert>
            <FlaskConical className="h-4 w-4" />
            <AlertTitle className="font-headline">Result</AlertTitle>
            <AlertDescription>
              Set infusion pump to <strong>{result.toFixed(1)} mL/hr</strong>.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}


export default function DrugCalculatorPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Drug Dosage Calculator</h1>
          <p className="text-muted-foreground">
            Essential calculations for safe medication administration.
          </p>
        </div>
      </div>

      <Tabs defaultValue="basic-formula" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic-formula">Desired/Have</TabsTrigger>
          <TabsTrigger value="weight-based">Single Dose</TabsTrigger>
          <TabsTrigger value="drip-rate">gtts/min</TabsTrigger>
          <TabsTrigger value="weight-based-iv">mcg/kg/min</TabsTrigger>
        </TabsList>
        <TabsContent value="basic-formula">
            <BasicFormulaCalculator />
        </TabsContent>
        <TabsContent value="weight-based">
            <WeightBasedCalculator />
        </TabsContent>
        <TabsContent value="drip-rate">
          <DripRateCalculator />
        </TabsContent>
        <TabsContent value="weight-based-iv">
          <WeightBasedIVRateCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
