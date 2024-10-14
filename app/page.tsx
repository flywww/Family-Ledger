'use client'

import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuList ,NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@radix-ui/react-navigation-menu";
import { useTheme } from "next-themes";


export default function Page() {
  const { setTheme } = useTheme();
  return (
    <div>
      <h1> Family ledge project start!!!!</h1>
      <Button onClick={() => setTheme("light")}> Dark mode </Button>
      <Button onClick={() => setTheme("dark")}> Light mode </Button>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink>Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            Item two
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
