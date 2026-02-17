import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Upload, MapPin, Sparkles, X, Send, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useIssues } from '@/contexts/IssueContext';
import { useToast } from '@/hooks/use-toast';
import { categoryLabels, departmentLabels, IssueCategory, IssueDepartment } from '@/types/issue';
import { z } from 'zod';
import { ImageModal } from '@/components/ui/image-modal';
import { analyzeIssueImage } from '@/services/GeminiService';

const issueSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  location: z.string().trim().min(3, 'Location must be at least 3 characters').max(300, 'Location too long'),
});

export default function AddProblem() {
  const { user, profile } = useAuth();
  const { addIssue } = useIssues();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory | ''>('');
  const [department, setDepartment] = useState<IssueDepartment | ''>('');
  const [location, setLocation] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);

    try {
      const data = await analyzeIssueImage(imageBase64, description);

      if (!data) {
        toast({
          title: "Analysis Unavailable",
          description: "We couldn't analyze the image automatically. Please fill in the details manually.",
          variant: "destructive",
        });
        return;
      }

      // Map AI response to form fields
      if (data.problem) {
        setTitle(data.problem);
      }
      if (data.reason) {
        setDescription(data.reason);
      }

      // Handle Department (Governing Body) mapping
      if (data.governing_body) {
        const deptMap: Record<string, IssueDepartment> = {
          'Municipality': 'municipal',
          'Corporation': 'corporation',
          'Town Panchayat': 'town_panchayat',
          'Panchayat': 'panchayat',
        };
        // Try exact match or look for substrings
        const mappedDept = deptMap[data.governing_body] ||
          Object.entries(deptMap).find(([key]) =>
            data.governing_body.includes(key))?.[1];

        if (mappedDept) {
          setDepartment(mappedDept);
        }
      }

      if (data.location) {
        setLocation(data.location);
      }

      toast({
        title: "AI Analysis Complete",
        description: "We've automatically filled in the details. Please review and edit if needed.",
      });
    } catch (err) {
      console.error('AI analysis error:', err);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please fill in the details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs with zod
    const result = issueSchema.safeParse({ title, description, location });
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    if (!image || !category || !department) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    addIssue({
      title,
      description,
      category: category as IssueCategory,
      department: department as IssueDepartment,
      location,
      imageUrl: image,
      status: 'pending',
      userId: user?.id || '',
      userName: profile?.name || '',
      city: profile?.city || '',
    });

    toast({
      title: "Issue Reported!",
      description: "Your complaint has been submitted successfully.",
    });

    navigate('/my-issues');
    setIsSubmitting(false);
  };

  return (
    <div className="px-4 py-6">
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={image}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-bold text-foreground mb-1">Report a Problem</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Upload an image and let AI analyze the issue
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Label className="mb-2 block">Problem Image *</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageUpload}
          />

          {image ? (
            <Card className="relative overflow-hidden">
              <img
                src={image}
                alt="Uploaded"
                className="w-full h-48 object-cover cursor-zoom-in"
                onClick={() => setShowImageModal(true)}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setImage(null);
                  setTitle('');
                  setDescription('');
                  setCategory('');
                  setDepartment('');
                  setLocation('');
                  setShowImageModal(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              {isAnalyzing && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center pointer-events-none">
                  <div className="bg-card rounded-lg p-4 flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-sm font-medium">AI Analyzing...</span>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">Upload or Take Photo</p>
              <p className="text-muted-foreground text-sm">Click to capture or select an image</p>
            </div>
          )}
        </motion.div>

        {/* AI-Filled Fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI-generated details (editable)</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Problem Title *</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                placeholder="Brief title of the issue"
                className="pl-10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the problem"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={department} onValueChange={(v) => setDepartment(v as IssueDepartment)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(departmentLabels)
                    .filter(([key]) => !['water', 'energy', 'pwd'].includes(key))
                    .map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Enter the location"
                className="pl-10"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || isAnalyzing || !image}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Submit Report
                <Send className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
