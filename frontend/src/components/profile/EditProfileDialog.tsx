import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { User, authApi } from "@/lib/api";
import { AvatarUpload } from "./AvatarUpload";
import { Loader2, Pencil, MapPin, Globe, Github, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditProfileDialogProps {
    user: User;
    onUpdate: (updatedUser: User) => void;
}

export function EditProfileDialog({ user, onUpdate }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        full_name: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        website_url: user.website_url || "",
        github_url: user.github_url || "",
        linkedin_url: user.linkedin_url || "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updatedUser = await authApi.updateProfile(formData);
            onUpdate(updatedUser);
            toast({
                title: "Profile updated",
                description: "Your profile has been successfully updated.",
            });
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <AvatarUpload user={user} onUpdate={onUpdate} size="md" />
                        <div>
                            <p className="text-sm font-medium">Profile Picture</p>
                            <p className="text-xs text-muted-foreground">
                                Click to upload (optional)
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name" name="full_name"
                            value={formData.full_name} onChange={handleChange}
                            placeholder="Your full name"
                        />
                    </div>

                    {/* Bio with counter */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="bio">Bio</Label>
                            <span className={`text-xs ${formData.bio.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {formData.bio.length}/500
                            </span>
                        </div>
                        <Textarea
                            id="bio" name="bio"
                            value={formData.bio} onChange={handleChange}
                            placeholder="Tell us a little about yourself"
                            maxLength={500} rows={3}
                        />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> Location
                        </Label>
                        <Input
                            id="location" name="location"
                            value={formData.location} onChange={handleChange}
                            placeholder="City, Country"
                        />
                    </div>

                    <Separator />

                    {/* URLs */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="website_url" className="flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5" /> Website
                            </Label>
                            <Input
                                id="website_url" name="website_url"
                                value={formData.website_url} onChange={handleChange}
                                placeholder="https://your-website.com"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="github_url" className="flex items-center gap-1.5">
                                    <Github className="h-3.5 w-3.5" /> GitHub
                                </Label>
                                <Input
                                    id="github_url" name="github_url"
                                    value={formData.github_url} onChange={handleChange}
                                    placeholder="GitHub URL"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin_url" className="flex items-center gap-1.5">
                                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                                </Label>
                                <Input
                                    id="linkedin_url" name="linkedin_url"
                                    value={formData.linkedin_url} onChange={handleChange}
                                    placeholder="LinkedIn URL"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
